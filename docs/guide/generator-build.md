---
sidebar_label: 生成器项目构建
title: 生成器项目构建
description: Flex、Bison 和 ANTLR 的 CMake、Gradle、Maven 构建配置
---

# 生成器项目构建

评测机支持以下前端生成工具，无需自行安装。

| 工具 | 实现语言 | 构建配置 |
| --- | --- | --- |
| Flex / Bison | C / C++ | [CMake](#flex-bison) |
| ANTLR 4.13.1 | C++ | [CMake](#antlr-cpp) |
| ANTLR 4.13.1 | Java | [Gradle](#antlr-java-build-tools) 或 [Maven](#antlr-maven) |

提交文法文件和源码，构建时自动生成前端。以下示例使用 `ToyC` 文法，按项目实际名称修改文件列表和入口类。

## Flex / Bison {/* #flex-bison */}

文件放在 `grammar/lexer.l`、`grammar/parser.y` 和 `src/main.cpp`。项目根目录的 `CMakeLists.txt` 如下：

```cmake
cmake_minimum_required(VERSION 3.20)
project(ToyC LANGUAGES CXX)

find_package(BISON REQUIRED)
find_package(FLEX REQUIRED)
file(MAKE_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}/generated")

BISON_TARGET(ToyCParser grammar/parser.y
  "${CMAKE_CURRENT_BINARY_DIR}/generated/parser.cpp"
  DEFINES_FILE "${CMAKE_CURRENT_BINARY_DIR}/generated/parser.hpp")
FLEX_TARGET(ToyCLexer grammar/lexer.l
  "${CMAKE_CURRENT_BINARY_DIR}/generated/lexer.cpp")
ADD_FLEX_BISON_DEPENDENCY(ToyCLexer ToyCParser)

add_executable(compiler src/main.cpp
  ${BISON_ToyCParser_OUTPUTS} ${FLEX_ToyCLexer_OUTPUTS})
target_compile_features(compiler PRIVATE cxx_std_17)
target_include_directories(compiler PRIVATE
  "${CMAKE_CURRENT_BINARY_DIR}/generated")
```

在 `lexer.l` 中设置 `%option noyywrap`，并包含 `parser.hpp`。`yylex`、`yyerror` 和 Token 类型须与语法文件一致。其他源码加入 `add_executable`。

```bash
# 在 Ubuntu 终端的项目根目录执行
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
ln -sfn build/compiler compiler
./compiler -asm < input.c > input.s
```

使用 Makefile 时，也要声明词法源码对 Bison 头文件的依赖。命令说明见 [FindBISON](https://cmake.org/cmake/help/latest/module/FindBISON.html) 和 [FindFLEX](https://cmake.org/cmake/help/latest/module/FindFLEX.html)。

## ANTLR C++ 与 CMake {/* #antlr-cpp */}

文法放在 `grammar/ToyC.g4`，入口放在 `src/main.cpp`。下面调用已安装的 `antlr4`，并链接 `/usr/local` 下的 4.13.1 运行库。

```cmake
cmake_minimum_required(VERSION 3.20)
project(ToyC LANGUAGES CXX)

find_program(ANTLR4_EXECUTABLE antlr4 REQUIRED)
find_package(Threads REQUIRED)
find_path(ANTLR4_INCLUDE_DIR antlr4-runtime.h
  PATHS /usr/local/include/antlr4-runtime NO_DEFAULT_PATH REQUIRED)
find_library(ANTLR4_LIBRARY NAMES antlr4-runtime
  PATHS /usr/local/lib /usr/local/lib64 NO_DEFAULT_PATH REQUIRED)

set(GEN_DIR "${CMAKE_CURRENT_BINARY_DIR}/generated")
set(GEN_SOURCES
  "${GEN_DIR}/ToyCLexer.cpp" "${GEN_DIR}/ToyCParser.cpp"
  "${GEN_DIR}/ToyCBaseVisitor.cpp" "${GEN_DIR}/ToyCVisitor.cpp")
set(GEN_HEADERS
  "${GEN_DIR}/ToyCLexer.h" "${GEN_DIR}/ToyCParser.h"
  "${GEN_DIR}/ToyCBaseVisitor.h" "${GEN_DIR}/ToyCVisitor.h")

add_custom_command(
  OUTPUT ${GEN_SOURCES} ${GEN_HEADERS}
  COMMAND "${CMAKE_COMMAND}" -E make_directory "${GEN_DIR}"
  COMMAND "${ANTLR4_EXECUTABLE}" -Dlanguage=Cpp -visitor -no-listener
          -o "${GEN_DIR}" ToyC.g4
  DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/grammar/ToyC.g4"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/grammar"
  VERBATIM)
add_custom_target(generate_frontend DEPENDS ${GEN_SOURCES} ${GEN_HEADERS})

add_executable(compiler src/main.cpp ${GEN_SOURCES})
add_dependencies(compiler generate_frontend)
target_compile_features(compiler PRIVATE cxx_std_17)
target_include_directories(compiler PRIVATE "${GEN_DIR}" "${ANTLR4_INCLUDE_DIR}")
target_link_libraries(compiler PRIVATE "${ANTLR4_LIBRARY}" Threads::Threads)
```

在项目根目录执行：

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
ln -sfn build/compiler compiler
```

拆分文法或使用 `import` 时，将相关文法加入生成命令和 `DEPENDS`。运行库说明见 [ANTLR C++ 文档](https://github.com/antlr/antlr4/blob/4.13.1/runtime/Cpp/README.md)。

## ANTLR Java 与 Gradle {/* #antlr-java-build-tools */}

文法放在 `src/main/antlr/ToyC.g4`，入口放在 `src/main/java/Main.java`。以下配置直接使用已安装的 ANTLR JAR，生成器和运行库均为 4.13.1。

`settings.gradle`：

```groovy
rootProject.name = 'toyc'
```

`build.gradle`：

```groovy
plugins {
    id 'antlr'
    id 'application'
}

def antlrJar = files(findProperty('antlrJar') ?:
    '/usr/local/lib/antlr/antlr-4.13.1-complete.jar')
dependencies {
    antlr antlrJar
    implementation antlrJar
}
generateGrammarSource {
    arguments += ['-visitor', '-no-listener']
}

tasks.withType(JavaCompile).configureEach {
    options.release = 21
    options.encoding = 'UTF-8'
}
application { mainClass = 'Main' }
```

构建：

```bash
gradle --no-daemon build installDist
```

项目根目录的 `compiler` 脚本：

```bash
#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$PROJECT_DIR/build/install/toyc/bin/toyc" "$@"
```

执行 `chmod +x compiler` 后即可使用 `./compiler -asm`。若使用 Java package，将 `mainClass` 改为完整类名。本地 JAR 路径不同时，可传入 `-PantlrJar=/实际路径/antlr-4.13.1-complete.jar`。

## ANTLR Java 与 Maven {/* #antlr-maven */}

Maven 项目将文法放在 `src/main/antlr4/`。在 `pom.xml` 中加入以下依赖和插件；首次构建会下载 Maven 插件及依赖。

```xml
<dependencies>
  <dependency>
    <groupId>org.antlr</groupId>
    <artifactId>antlr4-runtime</artifactId>
    <version>4.13.1</version>
  </dependency>
</dependencies>
<build>
  <plugins>
    <plugin>
      <groupId>org.antlr</groupId>
      <artifactId>antlr4-maven-plugin</artifactId>
      <version>4.13.1</version>
      <executions>
        <execution>
          <goals><goal>antlr4</goal></goals>
          <configuration>
            <visitor>true</visitor>
            <listener>false</listener>
          </configuration>
        </execution>
      </executions>
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>3.13.0</version>
      <configuration><release>21</release></configuration>
    </plugin>
  </plugins>
</build>
```

执行 `mvn -B package`。根目录的 `compiler` 脚本如下，`Main` 替换为实际入口类名：

```bash
#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec java -cp "$PROJECT_DIR/target/classes:/usr/local/lib/antlr/antlr-4.13.1-complete.jar" Main "$@"
```

执行 `chmod +x compiler`。有其他 Java 依赖时，一并加入 classpath。插件说明见 [ANTLR Maven 插件](https://www.antlr.org/api/maven-plugin/latest/usage.html)。
