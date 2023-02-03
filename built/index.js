import*as fs from"node:fs";import{fileURLToPath}from"node:url";import{dirname}from"node:path";import fastifyStatic from"@fastify/static";import{createTemp}from"./create-temp.js";import{FILE_TYPE_BROWSERSAFE}from"./const.js";import{convertToWebpStream,webpDefault}from"./image-processor.js";import{detectType,isMimeImage}from"./file-info.js";import sharp from"sharp";import{StatusError}from"./status-error.js";import{downloadUrl}from"./download.js";const _filename=fileURLToPath(import.meta.url);const _dirname=dirname(_filename);const assets=`${_dirname}/../../server/file/assets/`;export default function(fastify,options,done){fastify.addHook("onRequest",(request,reply,done)=>{reply.header("Content-Security-Policy","default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'");done()});fastify.register(fastifyStatic,{root:_dirname,serve:false});fastify.get("/proxy/:url*",async(request,reply)=>{return await proxyHandler(request,reply).catch(err=>errorHandler(request,reply,err))});done()}function errorHandler(request,reply,err){console.log(`${err}`);reply.header("Cache-Control","max-age=300");if(request.query&&"fallback"in request.query){return reply.sendFile("/dummy.png",assets)}if(err instanceof StatusError&&(err.statusCode===302||err.isClientError)){reply.code(err.statusCode);return}reply.code(500);return}async function proxyHandler(request,reply){const url="url"in request.query?request.query.url:"https://"+request.params.url;if(typeof url!=="string"){reply.code(400);return}const file=await downloadAndDetectTypeFromUrl(url);try{const isConvertibleImage=isMimeImage(file.mime,"sharp-convertible-image");const isAnimationConvertibleImage=isMimeImage(file.mime,"sharp-animation-convertible-image");let image=null;if("emoji"in request.query&&isConvertibleImage){if(!isAnimationConvertibleImage&&!("static"in request.query)){image={data:fs.createReadStream(file.path),ext:file.ext,type:file.mime}}else{const data=sharp(file.path,{animated:!("static"in request.query)}).resize({height:128,withoutEnlargement:true}).webp(webpDefault);image={data,ext:"webp",type:"image/webp"}}}else if("static"in request.query&&isConvertibleImage){image=convertToWebpStream(file.path,498,280)}else if("preview"in request.query&&isConvertibleImage){image=convertToWebpStream(file.path,200,200)}else if("badge"in request.query){if(!isConvertibleImage){throw new StatusError("Unexpected mime",404)}const mask=sharp(file.path).resize(96,96,{fit:"inside",withoutEnlargement:false}).greyscale().normalise().linear(1.75,-128*1.75+128).flatten({background:"#000"}).toColorspace("b-w");const stats=await mask.clone().stats();if(stats.entropy<.1){throw new StatusError("Skip to provide badge",404)}const data=sharp({create:{width:96,height:96,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).pipelineColorspace("b-w").boolean(await mask.png().toBuffer(),"eor");image={data:await data.png().toBuffer(),ext:"png",type:"image/png"}}else if(file.mime==="image/svg+xml"){image=convertToWebpStream(file.path,2048,2048)}else if(!file.mime.startsWith("image/")||!FILE_TYPE_BROWSERSAFE.includes(file.mime)){throw new StatusError("Rejected type",403,"Rejected type")}if(!image){image={data:fs.createReadStream(file.path),ext:file.ext,type:file.mime}}if("cleanup"in file){if("pipe"in image.data&&typeof image.data.pipe==="function"){image.data.on("end",file.cleanup);image.data.on("close",file.cleanup)}else{file.cleanup()}}reply.header("Content-Type",image.type);reply.header("Cache-Control","max-age=31536000, immutable");return image.data}catch(e){if("cleanup"in file)file.cleanup();throw e}}async function downloadAndDetectTypeFromUrl(url){const[path,cleanup]=await createTemp();try{await downloadUrl(url,path);const{mime,ext}=await detectType(path);return{state:"remote",mime,ext,path,cleanup}}catch(e){cleanup();throw e}}