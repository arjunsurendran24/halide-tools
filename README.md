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

*** Tested on Manjaro Linux 20.1 on Intel i7 CPU ***

## Release Notes

### 0.1.0

- Added support to cross compile to different architectures
- Added support to view psuedo-code of schdeules if they were to executed as a loop
- Added support to view lowered statement of functions
- Added support to generate template for generators

### Planned features

- Test on other OS
- Support for autoschedulers
- Generate CMAKE template
- Web Assembly support

