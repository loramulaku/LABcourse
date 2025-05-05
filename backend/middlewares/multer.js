import multer from 'multer'
import path from 'path'

// cakto vendin ku ruhen fotot
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads/') // sigurohu që ky folder ekziston
    },
    filename: function (req, file, callback) {
        const uniqueName = Date.now() + '-' + file.originalname
        callback(null, uniqueName)
    }
})

const upload = multer({ storage })

export default upload
