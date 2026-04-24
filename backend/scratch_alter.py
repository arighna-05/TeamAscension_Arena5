import sqlite3

def alter_db():
    conn = sqlite3.connect('c:/Users/cr7su/Downloads/devd/TeamAscension_Arena5/agrilink.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE inventory_items ADD COLUMN owner_username VARCHAR;")
        conn.commit()
        print("Column owner_username added successfully.")
    except Exception as e:
        print("Error or already exists:", e)
    
    # Also we should give existing items a default owner or just leave them null
    try:
        cursor.execute("UPDATE inventory_items SET owner_username = 'Anonymous Farmer' WHERE owner_username IS NULL;")
        conn.commit()
        print("Updated existing items.")
    except Exception as e:
        print("Error updating items:", e)
    conn.close()

if __name__ == '__main__':
    alter_db()
