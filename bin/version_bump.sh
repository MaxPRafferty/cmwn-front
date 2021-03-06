#!/usr/bin/env bash

if [ -z "$PACKAGE_FILE" ]
then
    PACKAGE_FILE="package.json"
fi

if [ ! -f $PACKAGE_FILE ] || [ ! -w $PACKAGE_FILE ] || [ ! -r $PACKAGE_FILE ]
then
    echo "The file $PACKAGE_FILE does not exist or is not read/writable"
    exit 2
fi

# the part of the version to bump
PART=$1

while [[ $# -gt 0 ]]
do
    key="$1"

    case $key in
        -d|--dry-run)
            DRYRUN="true"
            shift # past argument
        ;;
        -p|--print-current)
            ONLYCURRENT="true"
            shift # past argument
        ;;
        *)
            # unknown option
            shift # past argument or value
        ;;
    esac
done

CURRENT_VERSION=`cat $PACKAGE_FILE | sed -n 's/^.*version.*[^0-9]\([0-9]*\.[0-9]*\.[0-9]*\).*$/\1/p'`

MAJOR=$(echo $CURRENT_VERSION | cut -d'.' -f 1)
MINOR=$(echo $CURRENT_VERSION | cut -d'.' -f 2)
PATCH=$(echo $CURRENT_VERSION | cut -d'.' -f 3 | cut -d'-' -f 1)

if [ -z "${MAJOR}" ] || [ -z "${MINOR}" ] || [ -z "${PATCH}" ]
then
    echo "VAR $MAJOR.$MINOR.$PATCH is bad set or set to the empty string"
    exit 1
fi

case "$PART" in
    major )
        MAJOR=$(expr $MAJOR + 1)
        MINOR=0
        PATCH=0
        ;;

    minor )
        MINOR=$(expr $MINOR + 1)
        PATCH=0
        ;;

    patch )
        PATCH=$(expr $PATCH + 1)
        ;;

    --print-current )
        echo "$MAJOR.$MINOR.$PATCH"
        exit 0
        ;;

    * )
        echo "Error - argument must be 'major', 'minor', or 'patch'"
        echo "Usage: updateVersion [major | minor | patch]"
        exit 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

if [ "$DRYRUN" != "true" ]; then
    sed -i -- "s/$CURRENT_VERSION/$NEW_VERSION/g" $PACKAGE_FILE
fi

# the sed command will generate a file with -- at the end
# just clean up that file here
if [ -f "$PACKAGE_FILE--" ]
then
    rm -f $PACKAGE_FILE--
fi

if [ "$ONLYCURRENT" = 'true' ]; then
    echo $CURRENT_VERSION
else
    echo $NEW_VERSION
fi

