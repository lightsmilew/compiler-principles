CROSS_COMPILE ?= riscv64-unknown-elf-
CC = $(CROSS_COMPILE)gcc
AR = $(CROSS_COMPILE)ar
NM = $(CROSS_COMPILE)nm
READELF = $(CROSS_COMPILE)readelf
QEMU ?= qemu-riscv64
PYTHON ?= python3
BUILD_DIR ?= ../.cache/toyc-runtime
LIBRARY ?= ../static/downloads/libtoyc.a
CFLAGS = -O2 -march=rv64gc -mabi=lp64d -ffreestanding -fno-builtin \
         -fno-stack-protector -fno-pie -fno-unwind-tables \
         -fno-asynchronous-unwind-tables -msmall-data-limit=0 -Wall -Wextra -Werror
OBJECTS = $(BUILD_DIR)/start.o $(BUILD_DIR)/toyc-runtime.o

.PHONY: all test
all: $(LIBRARY)

$(BUILD_DIR):
	mkdir -p $@

$(BUILD_DIR)/start.o: start.S Makefile | $(BUILD_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/toyc-runtime.o: toyc-runtime.c Makefile | $(BUILD_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(LIBRARY): $(OBJECTS)
	mkdir -p $(dir $@)
	$(RM) $@.tmp
	$(AR) rcsD $@.tmp $(OBJECTS)
	mv $@.tmp $@

test: all
	$(PYTHON) test_runtime.py --library $(LIBRARY) --cc $(CC) --nm $(NM) --readelf $(READELF) --qemu $(QEMU)
