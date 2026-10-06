"""Link and run the published RV64GC/LP64D archive without a standard library."""

import argparse
from pathlib import Path
import random
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--library", type=Path, default=Path("../static/downloads/libtoyc.a"))
    parser.add_argument("--cc", default="riscv64-unknown-elf-gcc")
    parser.add_argument("--nm", default="riscv64-unknown-elf-nm")
    parser.add_argument("--readelf", default="riscv64-unknown-elf-readelf")
    parser.add_argument("--qemu", default="qemu-riscv64")
    args = parser.parse_args()
    library = args.library.resolve()

    symbols = subprocess.check_output([args.nm, "-g", "--defined-only", str(library)], text=True)
    exported = {line.split()[-1] for line in symbols.splitlines() if len(line.split()) == 3}
    assert exported == {"_start", "getint", "putint"}, exported
    undefined = subprocess.check_output([args.nm, "-u", str(library)], text=True)
    unresolved = {line.split()[-1] for line in undefined.splitlines() if line.strip().startswith("U ")}
    assert unresolved == {"main", "__global_pointer$"}, unresolved
    sections = subprocess.check_output([args.readelf, "-SW", str(library)], text=True)
    assert ".init_array" not in sections and ".fini_array" not in sections
    headers = subprocess.check_output([args.readelf, "-hA", str(library)], text=True)
    assert "RISC-V" in headers and "double-float ABI" in headers and "rv64" in headers

    flags = ["-march=rv64gc", "-mabi=lp64d", "-O2", "-ffreestanding", "-fno-builtin",
             "-fno-stack-protector", "-fno-pie", "-nostdlib", "-static"]
    with tempfile.TemporaryDirectory(prefix="toyc-runtime-") as directory:
        temp = Path(directory)

        def run_case(name, source, data, expected, exit_code=0):
            src = temp / f"{name}.c"
            asm = temp / f"{name}.s"
            binary = temp / name
            src.write_text(source, encoding="utf-8")
            subprocess.run([args.cc, *flags, "-S", str(src), "-o", str(asm)], check=True)
            # Exercise the exact assembly + archive link used by the course.
            subprocess.run([args.cc, *flags, str(asm), str(library), "-o", str(binary)], check=True)
            result = subprocess.run([args.qemu, str(binary)], input=data, capture_output=True, timeout=10)
            assert result.returncode == exit_code, (name, result.returncode, result.stderr)
            assert result.stdout == expected, (name, result.stdout[:200], expected[:200])
            assert result.stderr == b"", (name, result.stderr)
            print(f"PASS {name}")

        declarations = "int getint(void); void putint(int);\n"
        run_case("silent_exit", "int main(void) { return 37; }", b"", b"", 37)
        run_case("output_limits", declarations + """
            int main(void) {
                putint(0); putint(2147483647); putint(-2147483647 - 1);
                putint(-1); putint(42); return 0;
            }
        """, b"", b"02147483647-2147483648-142")
        run_case("input_limits", declarations + """
            int main(void) {
                for (int i = 0; i < 7; ++i) putint(getint());
                return 0;
            }
        """, b" \t\n\r\v\f+0 -0 2147483647 -2147483648 +42 12-34",
                 b"002147483647-21474836484212-34")
        run_case("empty_input", declarations + "int main(void) { putint(getint()); return 0; }",
                 b"", b"0")
        run_case("whitespace_eof", declarations + "int main(void) { putint(getint()); return 0; }",
                 b" \t\n\r\v\f", b"0")

        rng = random.Random(2026)
        values = [rng.randint(-2147483648, 2147483647) for _ in range(2500)]
        data = "\n".join(map(str, values)).encode()
        expected = "".join(map(str, values)).encode()
        run_case("buffer_refills", declarations + """
            int main(void) {
                for (int i = 0; i < 2500; ++i) putint(getint());
                return 0;
            }
        """, data, expected)
    print("PASS archive symbols, ABI, no constructors/destructors, and clean stderr")


if __name__ == "__main__":
    main()
