/* ToyC integer I/O for RV64 Linux. No libc or SysY timing hooks. */

enum { SYS_READ = 63, SYS_WRITE = 64, EINTR = 4 };

static long syscall3(long number, long arg0, long arg1, long arg2) {
    register long a0 __asm__("a0") = arg0;
    register long a1 __asm__("a1") = arg1;
    register long a2 __asm__("a2") = arg2;
    register long a7 __asm__("a7") = number;
    __asm__ volatile("ecall" : "+r"(a0) : "r"(a1), "r"(a2), "r"(a7) : "memory");
    return a0;
}

static unsigned char input_buffer[4096];
static long input_position;
static long input_length;
static int pending_char = -1;

static int read_char(void) {
    if (pending_char >= 0) {
        int ch = pending_char;
        pending_char = -1;
        return ch;
    }
    if (input_position == input_length) {
        long count;
        do {
            count = syscall3(SYS_READ, 0, (long)input_buffer, sizeof input_buffer);
        } while (count == -EINTR);
        if (count <= 0) {
            return -1;
        }
        input_position = 0;
        input_length = count;
    }
    return input_buffer[input_position++];
}

int getint(void) {
    int ch;
    do {
        ch = read_char();
    } while (ch == ' ' || (ch >= '\t' && ch <= '\r'));

    int negative = ch == '-';
    if (ch == '-' || ch == '+') {
        ch = read_char();
    }

    unsigned int value = 0;
    while (ch >= '0' && ch <= '9') {
        value = value * 10u + (unsigned int)(ch - '0');
        ch = read_char();
    }
    pending_char = ch;
    /* Unsigned arithmetic also handles INT_MIN without signed overflow. */
    return (int)(negative ? 0u - value : value);
}

void putint(int value) {
    char buffer[12];
    char *end = buffer + sizeof buffer;
    char *begin = end;
    unsigned int magnitude = value < 0 ? 0u - (unsigned int)value : (unsigned int)value;
    do {
        *--begin = (char)('0' + magnitude % 10u);
        magnitude /= 10u;
    } while (magnitude != 0);
    if (value < 0) {
        *--begin = '-';
    }

    /* Match putint's decimal output exactly; do not append a newline. */
    while (begin != end) {
        long count = syscall3(SYS_WRITE, 1, (long)begin, end - begin);
        if (count == -EINTR) {
            continue;
        }
        if (count <= 0) {
            return;
        }
        begin += count;
    }
}
