call env.cmd
call calcdeps.cmd

python %CLOSURE_LIB%/closure/bin/build/closurebuilder.py --root=%CLOSURE_LIB%/ --root=../js/ --namespace="org.koshinuke.main" --output_mode=compiled --compiler_jar=compiler.jar --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" > ../js/koshinuke-compiled.js
