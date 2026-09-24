FROM ubuntu:24.04

# 更换 Ubuntu 国内源
RUN sed -i s@/archive.ubuntu.com/@/mirrors.cernet.edu.cn/@g /etc/apt/sources.list

RUN apt-get update

# 安装必要软件（已移除 OCaml / opam / m4 相关组件）
RUN apt-get install -y --no-install-recommends qemu-user python3 python3-pip python3-dev build-essential wget curl unzip g++ clang cmake make bison flex git uuid-dev libantlr4-runtime-dev

# 安装 JDK 21
RUN wget https://download.java.net/java/GA/jdk21/fd2272bbf8e04c3dbaee13770090416c/35/GPL/openjdk-21_linux-x64_bin.tar.gz && mkdir -p /usr/lib/jvm && tar -xzf openjdk-21_linux-x64_bin.tar.gz -C /usr/lib/jvm && rm openjdk-21_linux-x64_bin.tar.gz

# 设置 JAVA_HOME 和 PATH 环境变量
ENV JAVA_HOME=/usr/lib/jvm/jdk-21
ENV PATH=$JAVA_HOME/bin:$PATH

# 安装 ANTLR 解析器生成器
RUN wget https://www.antlr.org/download/antlr-4.13.1-complete.jar && mkdir -p /usr/local/lib/antlr && mv antlr-4.13.1-complete.jar /usr/local/lib/antlr/
ENV CLASSPATH=/usr/local/lib/antlr/antlr-4.13.1-complete.jar:$CLASSPATH

# 安装 ANTLR 解析器生成器的 C++ 运行时库
RUN wget https://www.antlr.org/download/antlr4-cpp-runtime-4.13.1-source.zip && \
unzip antlr4-cpp-runtime-4.13.1-source.zip -d antlr4-cpp-runtime && \
cd antlr4-cpp-runtime && \
mkdir -p build && \
cd build && \
cmake .. -DANTLR_JAR_LOCATION=/usr/local/lib/antlr/antlr-4.13.1-complete.jar -DCMAKE_INSTALL_PREFIX=/usr/local -DWITH_DEMO=True && \
make -j$(nproc) && \
make install && \
cd / && \
rm -rf antlr4-cpp-runtime antlr4-cpp-runtime-4.13.1-source.zip

# 安装 RISC-V 工具链
RUN wget https://github.com/riscv-collab/riscv-gnu-toolchain/releases/download/2025.07.03/riscv32-elf-ubuntu-22.04-gcc-nightly-2025.07.03-nightly.tar.xz && tar -xf riscv32-elf-ubuntu-22.04-gcc-nightly-2025.07.03-nightly.tar.xz -C /opt && rm riscv32-elf-ubuntu-22.04-gcc-nightly-2025.07.03-nightly.tar.xz
ENV PATH=/opt/riscv/bin:$PATH

# 更换 Python 国内源
RUN pip config set global.index-url https://mirrors.cernet.edu.cn/pypi/web/simple

# 安装必要 Python 环境
RUN pip install --break-system-packages pygrading python-dotenv diff numpy

# 安装 Maven 构建工具
RUN wget https://dlcdn.apache.org/maven/maven-3/3.9.11/binaries/apache-maven-3.9.11-bin.tar.gz && tar -xzf apache-maven-3.9.11-bin.tar.gz -C /opt && rm apache-maven-3.9.11-bin.tar.gz
ENV PATH=/opt/apache-maven-3.9.11/bin:$PATH

# 安装 Gradle 构建工具
RUN wget https://services.gradle.org/distributions/gradle-8.5-bin.zip && unzip gradle-8.5-bin.zip -d /opt && rm gradle-8.5-bin.zip
ENV PATH=/opt/gradle-8.5/bin:$PATH

# 安装 Rust 工具链（Cargo 1.85.0，全局安装，所有用户可用）
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    RUSTUP_DIST_SERVER=https://mirrors.ustc.edu.cn/rust-static \
    RUSTUP_UPDATE_ROOT=https://mirrors.ustc.edu.cn/rust-static/rustup \
    PATH=/usr/local/cargo/bin:$PATH

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path --profile minimal --default-toolchain 1.85.0 --component clippy --component rustfmt && \
rustc --version && \
cargo --version && \
chmod -R a+w "$RUSTUP_HOME" "$CARGO_HOME"

# 配置 Cargo 国内镜像源
RUN printf '%s\n' \
'[source.crates-io]' \
"replace-with = 'ustc'" \
'' \
'[source.ustc]' \
'registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"' \
'' \
'[net]' \
'git-fetch-with-cli = true' \
> "$CARGO_HOME/config.toml"

# 创建 ANTLR 命令行工具的便捷脚本
RUN echo '#!/bin/bash\njava -jar /usr/local/lib/antlr/antlr-4.13.1-complete.jar "$@"' > /usr/local/bin/antlr4 && echo '#!/bin/bash\njava org.antlr.v4.gui.TestRig "$@"' > /usr/local/bin/grun && chmod +x /usr/local/bin/antlr4 /usr/local/bin/grun
