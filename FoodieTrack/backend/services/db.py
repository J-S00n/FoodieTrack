import snowflake.connector
import os
from dotenv import load_dotenv
from datetime import date

load_dotenv()  # loads your .env variables

def get_connection():
    return snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        role=os.getenv("SNOWFLAKE_ROLE"),
    )

def query_today():
    """
    Queries the given table and returns rows where day_column equals today.
    """
    today_str = date.today().isoformat()  # 'YYYY-MM-DD'

    sql = f"""
        SELECT *
        FROM menu_items
        WHERE day = '{today_str}'
    """

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [c[0] for c in cur.description]
        results = [dict(zip(columns, row)) for row in rows]
        return results
    finally:
        cur.close()
        conn.close()