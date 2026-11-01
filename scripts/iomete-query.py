"""Execute one operator-configured IOMETE connection. Secrets enter via environment, SQL via stdin."""
import json,os,sys,time

def main():
    from sqlalchemy import create_engine,text
    engine=create_engine(os.environ['IOMETE_SQLALCHEMY_URL'])
    try:
        payload=json.load(sys.stdin)
        start=time.perf_counter()
        with engine.connect() as connection:
            result=connection.execute(text(payload['sql']))
            columns=list(result.keys())
            rows=result.fetchmany(101)
        print(json.dumps({'columns':columns,'rows':[dict(zip(columns,row)) for row in rows[:100]],'truncated':len(rows)>100,'seconds':time.perf_counter()-start},default=str))
    finally:
        engine.dispose()

try:
    main()
except Exception:
    print(json.dumps({'error':'IOMETE query failed. Check the driver, read-only credentials, connection URL and cluster logs.'}))
    sys.exit(1)
