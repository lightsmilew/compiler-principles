/* Entry point for the documented -nostdlib -static link command. */
    .section .text
    .globl _start
    .type _start, @function
_start:
    .option push
    .option norelax
    la gp, __global_pointer$
    .option pop
    andi sp, sp, -16
    call main
    li a7, 93                   /* Linux exit(main()). */
    ecall
1:  j 1b
    .size _start, .-_start
    .section .note.GNU-stack,"",@progbits
