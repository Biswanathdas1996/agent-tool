import psycopg2
from psycopg2 import sql, OperationalError
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import networkx as nx


def create_connection(DB_CONFIG):
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        return connection
    except OperationalError as e:
        print(f"The error '{e}' occurred")
        return None

def get_erd_as_json(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()

        erd = {}
        for table in tables:
            table_name = table[0]
            cursor.execute(sql.SQL("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = {}").format(sql.Literal(table_name)))
            columns = cursor.fetchall()
            erd[table_name] = {
                "columns": [{"column_name": col[0], "data_type": col[1]} for col in columns],
                "relationships": []
            }

        cursor.execute("""
            SELECT
                tc.table_name AS source_table,
                kcu.column_name AS source_column,
                ccu.table_name AS target_table,
                ccu.column_name AS target_column
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY'
        """)
        relationships = cursor.fetchall()

        for rel in relationships:
            source_table, source_column, target_table, target_column = rel
            erd[source_table]["relationships"].append({
                "source_column": source_column,
                "target_table": target_table,
                "target_column": target_column
            })

        return json.dumps(erd, indent=4)
    except Exception as e:
        print(f"The error '{e}' occurred")
        return None

def save_erd_as_png(input_data, filename="sql/erd.png"):
    G = nx.DiGraph()

    for table, details in input_data.items():
        G.add_node(table)
        for relationship in details['relationships']:
            G.add_edge(table, relationship['target_table'], label=relationship['source_column'])

    pos = nx.spring_layout(G)
    plt.figure(figsize=(12, 9))
    pos = nx.spring_layout(G, k=1, iterations=50)  # Adjust k for spacing between nodes
    nx.draw(G, pos, with_labels=True, node_size=3000, node_color="#d04a0275", font_size=10, font_weight="bold", arrows=True, node_shape='s')
    edge_labels = nx.get_edge_attributes(G, 'label')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color='red')
    plt.title("Entity Relationship Diagram")
    plt.savefig(filename)
    plt.close()

def generate_erd_from(DB_CONFIG):
    connection = create_connection(DB_CONFIG)
    if connection:
        erd_json = get_erd_as_json(connection)
        # create_erd(json.loads(erd_json))
        save_erd_as_png(json.loads(erd_json))
        connection.close()
        print(erd_json)
        return erd_json
    

def execute_sql_query(DB_CONFIG, query):
    connection = create_connection(DB_CONFIG)
    if connection:
        try:
            cursor = connection.cursor()
            cursor.execute(query)
            connection.commit()
            result = cursor.fetchall()
            return result
        except Exception as e:
            print(f"The error '{e}' occurred")
            return None
        finally:
            cursor.close()
            connection.close()
    else:
        return None


