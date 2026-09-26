import express from "express";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

const app=express();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024}});
app.use(express.static("public"));
app.get("/api/health",(req,res)=>res.json({ok:true,aiConfigured:Boolean(process.env.OPENAI_API_KEY)}));

app.post("/api/edit",upload.single("image"),async(req,res)=>{
  try{
    if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"AI belum dikonfigurasi. Tetapkan OPENAI_API_KEY di hosting."});
    if(!req.file)return res.status(400).json({error:"Sila pilih gambar."});
    const prompt=String(req.body.prompt||"").trim();
    if(!prompt)return res.status(400).json({error:"Sila tulis arahan AI."});
    const form=new FormData();
    form.append("model",process.env.OPENAI_IMAGE_MODEL||"gpt-image-2");
    form.append("prompt",prompt);
    form.append("image[]",new Blob([req.file.buffer],{type:req.file.mimetype}),req.file.originalname||"image.png");
    const r=await fetch("https://api.openai.com/v1/images/edits",{
      method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form
    });
    const data=await r.json();
    if(!r.ok)return res.status(r.status).json({error:data?.error?.message||"AI gagal memproses gambar."});
    const b64=data?.data?.[0]?.b64_json;
    if(!b64)return res.status(502).json({error:"AI tidak memulangkan gambar."});
    res.json({image:`data:image/png;base64,${b64}`});
  }catch(e){console.error(e);res.status(500).json({error:"Ralat pelayan."});}
});
const port=process.env.PORT||3000;
app.listen(port,()=>console.log("Edit Semula Gambar V5:",port));
