from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, os

ROOT=Path(__file__).resolve().parent
SHOTS=ROOT/'screenshots'
OUT=ROOT/'walkthrough.mp4'
FRAMES=ROOT/'walkthrough-frames'
FRAMES.mkdir(exist_ok=True)
steps=[
 ('01-overview.jpg',10,'01 · Inspect the pipeline','Open enquiries and due or overdue reminders appear at a glance.'),
 ('02-new-enquiry.jpg',10,'02 · Start a customer enquiry','Capture the contact, category, owner, due date and notes in one form.'),
 ('03-filled-enquiry.jpg',12,'03 · Enter contact details','Synthetic example: Jordan Smith asks about a group booking.'),
 ('04-created.jpg',12,'04 · Create the record','The new enquiry enters the pipeline with a visible activity history.'),
 ('05-stage-update.jpg',12,'05 · Progress the stage','Move New to Contacted; the change is recorded in activity.'),
 ('06-follow-up.jpg',12,'06 · Record the follow-up','The action is logged with the next due date.'),
 ('07-due-filter.jpg',10,'07 · Prioritize the queue','Filter to enquiries due today or already overdue.'),
 ('08-persisted.jpg',12,'08 · Confirm persistence','After refresh, the new record remains in local SQLite.'),
]
font_path='/System/Library/Fonts/Supplemental/Arial.ttf'
font=ImageFont.truetype(font_path,34)
small=ImageFont.truetype(font_path,21)
for i,(name,duration,title,subtitle) in enumerate(steps,1):
 shot=Image.open(SHOTS/name).convert('RGB')
 canvas=Image.new('RGB',(1440,900),'#18382f')
 draw=ImageDraw.Draw(canvas)
 draw.text((85,23),'ENQUIRY DESK  /  PROTOTYPE WALKTHROUGH',font=small,fill='#d6e1bc')
 canvas.paste(shot,(87,68))
 draw.text((85,795),title,font=font,fill='#f5f5eb')
 draw.text((85,843),subtitle,font=small,fill='#d9e3d2')
 canvas.save(FRAMES/f'{i:02d}.jpg',quality=92)
concat=ROOT/'walkthrough-frames.txt'
with concat.open('w') as f:
 for i,(_,duration,_,_) in enumerate(steps,1):
  f.write(f"file '{(FRAMES/f'{i:02d}.jpg').as_posix()}'\n")
  f.write(f'duration {duration}\n')
 f.write(f"file '{(FRAMES/'08.jpg').as_posix()}'\n")
 f.write('duration 0.0417\n')
ffmpeg=os.environ.get('FFMPEG_BIN','ffmpeg')
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-t','90','-vf','fps=24,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','23','-movflags','+faststart',str(OUT)],check=True)
print(OUT)
