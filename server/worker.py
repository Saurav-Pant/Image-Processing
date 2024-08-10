from rq import Worker, Connection
from config import get_redis_connection

listen = ['default']

if __name__ == '__main__':
    conn = get_redis_connection()
    with Connection(conn):
        worker = Worker(listen)
        worker.work()