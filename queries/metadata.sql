select * from duckdb_constraints() where table_name like 'aws_%';

select table_name, column_name, data_type from duckdb_columns() where table_name like 'aws_%' order by table_name, column_index ASC;