from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import httpx
import uvicorn

app = FastAPI(title="Douyin Downloader API")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Douyin Downloader API is running"}

@app.get("/api/expand")
async def expand_url(url: str = Query(..., description="Short URL to expand")):
    """
    展开短链接
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.head(url)
            # 如果 HEAD 请求没有获取到最终 URL，尝试 GET
            if response.status_code >= 400:
                response = await client.get(url)
            
            return {
                "url": str(response.url),
                "original_url": url,
                "success": True
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download")
async def download_video(url: str = Query(..., description="Video direct URL")):
    """
    代理下载视频，解决 CORS 问题
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    async def iterfile():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", url, headers={"User-Agent": "Mozilla/5.0"}) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    # 获取文件名（这里简单处理，实际可以从 URL 或 Content-Disposition 获取）
    filename = "video.mp4"
    
    return StreamingResponse(
        iterfile(),
        media_type="video/mp4",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
