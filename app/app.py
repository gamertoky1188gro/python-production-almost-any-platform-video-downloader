import argparse
import os
from yt_dlp import YoutubeDL

def download_progress(d):
    if d['status'] == 'downloading':
        # Extract percentage without extra spaces
        percent = d.get('_percent_str', '0.0%').strip()
        print(f"Progress: {percent}", flush=True)  # Use flush=True for real-time updates
    elif d['status'] == 'finished':
        sanitized_filename = ''.join(c if c.isascii() else '?' for c in d['filename'])
        print(f"Downloaded file: {d['filename']}".encode("ascii", "replace").decode("ascii"), flush=True)

def download_content(url, download_type, format_type, output_dir):
    ydl_opts = {
        "outtmpl": f"{output_dir}/%(title)s.%(ext)s",
        "progress_hooks": [download_progress],
        "quiet": True,  # Suppress unnecessary logs
        "no_warnings": True,  # Suppress warnings
    }

    if format_type == "mp3":
        ydl_opts["format"] = "bestaudio/best"
        ydl_opts["postprocessors"] = [
            {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"},
        ]
    elif format_type == "mp4":
        ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]"
    elif format_type == "webm":
        ydl_opts["format"] = "bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]"

    os.makedirs(output_dir, exist_ok=True)

    try:
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        # Log the error and continue
        print(f"Error occurred while downloading {url}: {str(e)}", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YouTube Downloader")
    parser.add_argument("--url", required=True, help="The URL of the video/playlist.")
    parser.add_argument("--type", required=True, choices=["video", "playlist", "mix", "channel"], help="Download type.")
    parser.add_argument("--format", required=True, choices=["mp3", "mp4", "webm"], help="Output format.")
    parser.add_argument("--directory", required=True, help="Download directory.")

    args = parser.parse_args()

    # Split URLs for batch processing (if multiple URLs are provided, separated by commas)
    urls = args.url.split(",")
    for url in urls:
        print(f"Starting download for: {url}", flush=True)
        download_content(url.strip(), args.type, args.format, args.directory)
        print(f"Finished processing: {url}", flush=True)
