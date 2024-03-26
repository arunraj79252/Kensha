const { Forbidden } = require("../utils/errors")

/**
 * autherize user based on role
 * @param  {...any} permittedRoles 
 * 
 * if permittedRoles containes user's role continue to next middleware
 */
const permit = (...permittedRoles) => async (req, res, next) => {
    if (!req.user||!permittedRoles.includes(req.user.usertype))
        next(new Forbidden({error:"You don't have permission to access this resource!", error_Code:804}))
    next();
}

module.exports = permit;