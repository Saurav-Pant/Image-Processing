import json
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import get_s3_client, get_task_queue, BUCKET_NAME
from tasks import process_image
import logging

app = FastAPI()

s3 = get_s3_client()
task_queue = get_task_queue()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), operations: str = Form(...)):
    try:
        logger.info(f"Received file: {file.filename}")
        logger.info(f"Operations: {operations}")
        
        contents = await file.read()
        s3.put_object(Bucket=BUCKET_NAME, Key=file.filename, Body=contents)
        
        operations_list = json.loads(operations)
        
        job = task_queue.enqueue(process_image, file.filename, operations_list)

        return JSONResponse(content={
            "message": "File uploaded and processing started",
            "job_id": job.id
        }, status_code=200)
    
    except json.JSONDecodeError as e:
        logger.error(f"JSON Decode Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid operations JSON: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/job_status/{job_id}")
def job_status(job_id: str):
    job = task_queue.fetch_job(job_id)
    
    if job is None:
        return JSONResponse(content={"message": "Job not found"}, status_code=404)
    
    status = job.get_status()
    
    if status == 'finished':
        result = job.result
        if result:
            processed_filename = f"{result}"
            processed_url = f"https://pub-96d3131e0e7248bf8295a83f682993ab.r2.dev/{processed_filename}"
            logger.info(f"Processed URL: {processed_url}")
            return JSONResponse(content={
                "status": status,
                "processed_url": processed_url,
                "job_id": job_id
            }, status_code=200)
    elif status == 'failed':
        return JSONResponse(content={"status": status, "message": "Image processing failed"}, status_code=200)
    
    return JSONResponse(content={"status": status}, status_code=200)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
