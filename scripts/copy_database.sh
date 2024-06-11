#!/bin/bash

DATA_PATH="$PWD/data/db/iam.duckdb"

rm -f $DATA_PATH

mkdir -p $PWD/data/db/

duckdb $DATA_PATH < queries/create_database.sql
