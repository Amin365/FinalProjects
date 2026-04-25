
import jwt from 'jsonwebtoken'

export const GenarateToken =(UserID)=>{
    return jwt.sign({id:UserID},process.env.JWT_SECRET,
        {expiresIn:'7d'}
    )

}