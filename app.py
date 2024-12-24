from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 数据库配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '15680911723angY@',
    'database': 'personal_blog'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"数据库连接错误: {e}")
        return None

@app.route('/api/likes', methods=['GET'])
def get_likes():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT count FROM likes WHERE id = 1")
            result = cursor.fetchone()
            return jsonify({'likes': result['count']})
        except Error as e:
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()
            conn.close()
    return jsonify({'error': '数据库连接失败'}), 500

@app.route('/api/likes', methods=['POST'])
def update_likes():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE likes SET count = count + 1 WHERE id = 1")
            conn.commit()
            
            # 获取更新后的点赞数
            cursor.execute("SELECT count FROM likes WHERE id = 1")
            result = cursor.fetchone()
            return jsonify({'likes': result[0]})
        except Error as e:
            conn.rollback()
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()
            conn.close()
    return jsonify({'error': '数据库连接失败'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True) 