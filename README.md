# halide-tools README

VS Code Extension for halide scripts

- Template generation for generator scripts
- View Pseudocode of schedules
- View lowered statements
- Compile and cross compile as static library and object files to other architectures

## Requirements

- Halide. Visit https://github.com/halide/Halide for instructions for installation

## Extension Settings

This extension contributes the following settings:

* `halide-tools.halideInstallationPath` : Path to Halide installation
* `halide-tools.compilerPath` :  Path to C++ compiler to be used
* `halide-tools.cppStandard` : C++ standard with which generators and scripts to be compiled
* `halide-tools.binaryPath` : "Choose the path to save object and library files"
* `halide-tools.debugCodeGenLevel` : Higher the value more verbose the output while lowering,
* `halide-tools.targetOS` : For crosscompiling, specify the OS
* `halide-tools.targetBits` : For cross-compiling specify number of bits of target architecture
* `halide-tools.targetArch` : For cross-compiling specify architecture
* `halide-tools.targetFeatures`: For cross-compiling specify features wanted

