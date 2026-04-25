
export const NotFound =(req,res,next)=>{
    const error=new Error(`rout of ${req.originalUrl} not Found`)
    error.status = 404;
    error.statusCode = 404;

    next(error)
} 