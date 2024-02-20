TSCONFIG=tsconfig.tmp.json
# setting this flag skips typscript validation
STFU_TSC=false
# setting this flag skips typscript validation
SEMI_TSC=false
# watch & rebuild when files change
WATCH_IT=false
# building for nodejs
LIB_MODE=false
# building for the browser
BRO_MODE=false
DO_TYPES=false
DO_CLEAN=false
FILES=""
ENTRY=()

# TODO - watching solutions other than fswatch (like UHHHHHH)
# TODO - output files wherewhere
function usage {
  echo "Usage: $(basename ${0}) [-cndblt] [...ENTRY_POINT]" 1>&2
  echo "	-c ··· cleans existing files in output dir (dist/)" 1>&2
  echo "	-n ··· tell typescript \"STFU, I'M BUSY RIGHT NOW\"" 1>&2
  echo "	-p ··· don't allow a failed typecheck to stop the build " 1>&2
  echo "	-w ··· watch: fswatch src/ for changes and rebuild" 1>&2
  echo "	-l ··· build as node lib (default)" 1>&2
  echo "	-b ··· build as browser lib" 1>&2
  echo "	-t ··· emit type declarations" 1>&2

  # TODO - run flag?
  exit 1
}

# run tsc for type checks
function verify {

cat <<EOF > ${TSCONFIG}
{
  "extends": "./tsconfig.json",
  "files": [${FILES}],
  "compilerOptions": {
    "noEmit": true
  }
}
EOF

  local OK=true
  if pnpm tsc --project ${TSCONFIG}; then OK=false; fi
  rm ${TSCONFIG}

  if $OK && ! $SEMI_TSC ; then
    echo "💀 better luck next time 💀";
    return 1;
  fi;

  return 0
}

function out_dir_check {
  if ! [[ -d dist ]] ; then mkdir dist || return 1; fi;
  if ${DO_CLEAN} ; then rm -r dist/* || return 1; fi
}

function build_all {
  if ! out_dir_check ;
    then echo "bad out dir!" 1>&2; return 1;
  elif $STFU_TSC || verify; then
    if $DO_TYPES && ! emit_types ; then return 1; fi;
    if $BRO_MODE && ! build_browser ; then return 1; fi;
    if $LIB_MODE && ! build_node ; then return 1; fi;
    echo "builded ok" 1>&2;
  fi;
}

function watch_build {
  #if ! build_all ; then exit 1; fi
  build_all

  # TODO - don't cancel? idk
  fswatch -o0 --event=Updated src/ \
    | while read -d '' -a EVENT; do build_all; done;
}

function build_node {
cat <<EOF > ${TSCONFIG}
{
  "extends": "./tsconfig.json",
  "files": [${FILES}],
}
EOF

  local BUILD_ARGS=(
    ${ENTRY[@]}
    --bundle
    --outdir="dist"
    --format="esm"
    --target="esnext"
    --platform="node"
    --tsconfig="${TSCONFIG}"
    --sourcemap="inline"
  )
  echo "building (node)" ${BUILD_ARGS[@]}
  pnpm esbuild ${BUILD_ARGS[@]}
  echo "ok."
  local RVAL=$?
  rm ${TSCONFIG}
  return ${RVAL}
}

function build_browser {
cat <<EOF > ${TSCONFIG}
{
  "extends": "./tsconfig.json",
  "files": [${FILES}],
  "compilerOptions": {
    "lib": ["ESNext", "es2023", "DOM"],
  }
}
EOF

  # DONT FORGET ME!
  # --loader:.wgsl=text
  local BUILD_ARGS=(
    ${ENTRY[@]}
    --bundle
    --outdir="dist"
    --format="esm"
    --target="esnext"
    --platform="browser"
    --tsconfig="${TSCONFIG}"
    --sourcemap="inline"
  )
  echo "building (browser)" ${BUILD_ARGS[@]}
  pnpm esbuild ${BUILD_ARGS[@]}
  local RVAL=$?
  rm ${TSCONFIG}
  return ${RVAL}
}

function emit_types {
cat <<EOF > ${TSCONFIG}
{
  "extends": "./tsconfig.json",
  "files": [${FILES}],
  "compilerOptions": {
    "outDir": "dist",
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "lib": ["ESNext", "es2023", "DOM"],
  }
}
EOF

  echo "building (type declarations)"
  pnpm tsc --project ${TSCONFIG}
  local RVAL=$?
  rm ${TSCONFIG}
  return ${RVAL}
}

while getopts 'cndblt' OPT; do
  case "${OPT}" in
    c)
      DO_CLEAN=true
      ;;
    n)
      STFU_TSC=true
      ;;
    w)
      WATCH_IT=true
      ;;
    l)
      LIB_MODE=true
      ;;
    b)
      BRO_MODE=true
      ;;
    t)
      DO_TYPES=true
      ;;
    ?)
      echo "unrecognized option \"$OPT\""
      usage;
      ;;
    h)
      usage;
      ;;
  esac
done

shift "$(($OPTIND -1))"

# Default entry point (no args)
if [[ $# -eq 0 ]]; then
  set -- src/index.ts
fi

# make a json list out of arguments ok
# TODO - probably allow actual args? idk, maybe a subset
ENTRY=$@
FILES=$(printf '"%s",' "${ENTRY[@]}"| sed -e 's|,$||')

# ensure there is some build? (change for a different default)
if ! ($BRO_MODE || $LIB_MODE || $DO_TYPES); then
  LIB_MODE=true
fi;

if $WATCH_IT ; then watch_build; else build_all; fi

