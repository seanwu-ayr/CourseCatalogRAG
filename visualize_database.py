import psycopg2

# PostgreSQL connection configuration
config = {
    'host': "scu-info.cpkec8qcwpzs.us-east-2.rds.amazonaws.com",
    'user': 'sakadaai',
    'password': 'sakadaai2000',
    'database': 'SCU_INFO'
}

# Connect to the PostgreSQL database
try:
    connection = psycopg2.connect(**config)
    cursor = connection.cursor()

    # The name of the table you want to inspect
    table_name = 'courses'

    print(f"Checking the table: '{table_name}'")

    # 1. Fetch Column Information
    print("\n1. Column Information:")
    query_columns = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = %s;
    """
    cursor.execute(query_columns, (table_name,))
    columns = cursor.fetchall()

    # Store column names separately for later use
    column_names = [col[0] for col in columns]

    print(f"Columns in the table '{table_name}':")
    for column in columns:
        print(f"Column Name: {column[0]}, Data Type: {column[1]}, Is Nullable: {column[2]}")

    # 2. Fetch Table Size
    print("\n2. Table Size:")
    query_size = """
        SELECT pg_size_pretty(pg_total_relation_size(%s));
    """
    cursor.execute(query_size, (table_name,))
    table_size = cursor.fetchone()

    print(f"Size of the table '{table_name}': {table_size[0]}")

    # 3. Row Count
    print("\n3. Row Count:")
    query_row_count = f"SELECT COUNT(*) FROM {table_name};"
    cursor.execute(query_row_count)
    row_count = cursor.fetchone()

    print(f"Number of rows in the table '{table_name}': {row_count[0]}")

    # 4. Fetch Sample Data
    print("\n4. Sample Data:")
    query_sample = f"""
        SELECT *
        FROM {table_name}
        WHERE courselisting LIKE 'ACLA%'
        LIMIT 2750;
    """
    cursor.execute(query_sample)
    rows = cursor.fetchall()

    print(f"Sample rows from the table '{table_name}':")
    for row in rows:
        print("Row:")
        for col_name, value in zip(column_names, row):
            print(f"  {col_name}: {value}")

    # 5. Fetch Index Information
    print("\n5. Index Information:")
    query_indexes = f"""
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = '{table_name}';
    """
    cursor.execute(query_indexes)
    indexes = cursor.fetchall()

    print(f"Indexes on the table '{table_name}':")
    for index in indexes:
        print(f"Index Name: {index[0]}, Definition: {index[1]}")

except Exception as error:
    print(f"Error: {error}")

finally:
    # Close the cursor and connection
    if cursor:
        cursor.close()
    if connection:
        connection.close()



"""
1. Column Information:
Columns in the table 'courses':
Column Name: maximumunits, Data Type: numeric, Is Nullable: YES
Column Name: minimumunits, Data Type: numeric, Is Nullable: YES
Column Name: courselisting, Data Type: character varying, Is Nullable: YES
Column Name: title, Data Type: character varying, Is Nullable: YES
Column Name: academicunits, Data Type: ARRAY, Is Nullable: YES
Column Name: schools, Data Type: ARRAY, Is Nullable: YES
Column Name: coursesubjects, Data Type: ARRAY, Is Nullable: YES
Column Name: academiclevel, Data Type: character varying, Is Nullable: YES
Column Name: prerequisitecourses, Data Type: ARRAY, Is Nullable: YES
Column Name: corequisitecourses, Data Type: ARRAY, Is Nullable: YES
Column Name: specialtopics, Data Type: ARRAY, Is Nullable: YES
Column Name: publicnotes, Data Type: text, Is Nullable: YES
Column Name: description, Data Type: text, Is Nullable: YES
Column Name: coursereferenceid, Data Type: character varying, Is Nullable: NO
Column Name: coursestatus, Data Type: character varying, Is Nullable: YES
Column Name: courseid, Data Type: character varying, Is Nullable: YES

2. Table Size:
Size of the table 'courses': 11 MB

3. Row Count:
Number of rows in the table 'courses': 15399

4. Sample Data:
Sample rows from the table 'courses':
('ACLA_102Z', 'ACLA_102Z', 'ACLA 102Z', 'Information Lit Elec Tech', ["'Arts and Sciences Department'"], ["'College of Arts and Sciences'"], ["'Adult College of Liberal Arts'"], 'Undergraduate', [], [], [], '', '', Decimal('1.0'), Decimal('1.0'), 'Approved')
('ACLA_110Z', 'ACLA_110Z', 'ACLA 110Z', 'Tao/Art Extra Perf Life', ["'Arts and Sciences Department'"], ["'College of Arts and Sciences'"], ["'Adult College of Liberal Arts'"], 'Undergraduate', [], [], [], '', '', Decimal('1.0'), Decimal('1.0'), 'Approved')
('ACLA_105Z', 'ACLA_105Z', 'ACLA 105Z', 'The Literacy Decline', ["'Arts and Sciences Department'"], ["'College of Arts and Sciences'"], ["'Adult College of Liberal Arts'"], 'Undergraduate', [], [], [], '', '', Decimal('4.0'), Decimal('4.0'), 'Approved')
('ACLA_100Z', 'ACLA_100Z', 'ACLA 100Z', 'Critical Thinking for College Teachers', ["'Arts and Sciences Department'"], ["'College of Arts and Sciences'"], ["'Adult College of Liberal Arts'"], 'Undergraduate', [], [], [], '', '', Decimal('1.0'), Decimal('1.0'), 'Approved')
('ACLA_112Z', 'ACLA_112Z', 'ACLA 112Z', 'Teach Children to Discover', ["'Arts and Sciences Department'"], ["'College of Arts and Sciences'"], ["'Adult College of Liberal Arts'"], 'Undergraduate', [], [], [], '', '', Decimal('1.0'), Decimal('1.0'), 'Approved')

5. Index Information:
Indexes on the table 'courses':
Index Name: courses_pkey, Definition: CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (coursereferenceid)
"""