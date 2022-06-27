const blogModel = require("../model/blogModel");
const authorModel = require("../model/authorModel");
const validator = require("../utils/validator");



const createBlog = async function(req, res) {
    try {
        let requestBody = req.body;
        // const tokenId = req.authorId
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false,
                messege: "Invalid request parameters. Please provide blog details",
            });
        }
        // extract parameters
        const { title, body, authorId, tags, category, subcategory, isPublished } = requestBody; //destructuring 


        //  Validation starts
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, messege: "Blog Title is required" });
        }else if (!isNaN(title)) {
            return res
                .status(400)
                .send({ status: false, msg: "title cannot be a number" });
        }
        if (!validator.isValid(body)) {
            return res.status(400).send({ status: false, messege: "Blog body is required" });
        }
        if (!validator.isValid(authorId)) {
            return res.status(400).send({ status: false, messege: "AuthorId is required" });
        }
        if (!validator.isValidObjectId(authorId)) {
            return res.status(400).send({
                status: false,
                messege: `${authorId} is not a valid author id`,
            });
        }

        const findAuthor = await authorModel.findById(authorId);
        if (!findAuthor) {
            return res
                .status(400)
                .send({ status: false, message: "Author does not exists." });
        }
        if (!validator.isValid(category)) {
            return res
                .status(400)
                .send({ status: false, message: "Blog category is required" });
        }
        if (!validator.isValid(tags)) {
            return res
                .status(400)
                .send({ status: false, message: "Blog tags is required" });
        }
        if (!validator.isValid(subcategory)) {
            return res
                .status(400)
                .send({ status: false, message: "Blog subcategory is required" });
        }
        //validation Ends

        const blogData = {
            title,
            body,
            authorId,
            category,
            tags,
            subcategory,
            isPublished: isPublished ? isPublished : false, //ternary operator
            publishedAt: isPublished ? new Date() : null,
        };

        if (tags) {
            if (Array.isArray(tags)) {
                const uniqueTagArr = [...new Set(tags)];
                blogData["tags"] = uniqueTagArr; //Using array constructor here
            }

            }
        

        if (subcategory) {
            if (Array.isArray(subcategory)) {
                const uniqueSubcategoryArr = [...new Set(subcategory)]; //new set() is don't allow to deplicat value in array
                blogData["subcategory"] = uniqueSubcategoryArr; //Using array constructor here
            }
        }

        const newBlog = await blogModel.create(blogData);
        return res.status(201).send({
            status: true,
            message: "New blog created successfully",
            data: newBlog,
        });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};

const getBlog = async function (req, res) {
    try {
        //getting data from query params
        let filters = req.query
        //checking if there is any filter present or not
        if (Object.keys(filters).length >= 1) { // it's return a array 
            //adding more conditions to the filter
            filters.isDeleted = false
            filters.isPublished = true
           
            //checking if we have a tag filter to match
            if (filters.tags) {
                let tagArray
                if (filters.tags.includes(",")) { // it's find in array if value match so return true or false 
                    tagArray = filters.tags.split(",").map(String).map(x => x.trim()) // map :- it's return new array 
                    console.log(tagArray)
                    filters.tags = { $all: tagArray }
                    console.log(filters.tags)
                } else {
                    tagArray = filters.tags.trim().split("  ").map(String).map(x => x.trim())
                    filters.tags = { $all: tagArray }
                } 
            }


            //checking if we have a subcatagory filter to match
            if (filters.subcategory) {
                let subcatArray
                if (filters.subcategory.includes(",")) {
                    subcatArray = filters.subcategory.split(",").map(String).map(x => x.trim())
                    filters.subcategory = { $all: subcatArray }
                }
                else {
                    subcatArray = filters.subcategory.trim().split("   ").map(String).map(x => x.trim())
                    filters.subcategory = { $all: subcatArray }
                }
            }
            


            //finding the data using the filter
            let filteredBlogs = await blogModel.find(filters)
            if (filteredBlogs.length === 0) return res.status(404).send({ status: false, msg: "No such data available" })
            else return res.status(200).send({ status: true, msg: filteredBlogs })
        }
        let blogs = await blogModel.find({ isDeleted: false, isPublished: true })
        if (blogs.length == 0) res.status(404).send({ status: false, msg: "No result found" })
        res.status(200).send({ status: true, msg: blogs })
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}


//Update blogs
const updateDetails = async function(req, res) {
    try {
        let authorIdFromToken = req.authorId;
        let blogId = req.params.blogId;
        let requestBody = req.body;
        const { title, body, tags, subcategory } = requestBody;

        if (!validator.isValidRequestBody(req.params)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. Please provide query details" });
        }


        if (!validator.isValidObjectId(blogId)) {
            return res
                .status(400)
                .send({ status: false, message: `BlogId is invalid.` });
        }

        if (!validator.isValid(title)) {
            return res
                .status(400)
                .send({ status: false, message: "Title is required for updatation." });
        }

        if (!validator.isValid(body)) {
            return res
                .status(400)
                .send({ status: false, message: "Body is required for updatation." });
        }


            if (!validator.isValid(tags)) {
                return res
                    .status(400)
                    .send({ status: false, message: "tags is required for updatation." });
            }
        

    
            if (!validator.isValid(subcategory)) {
                return res.status(400).send({
                    status: false,
                    message: "subcategory is required for updatation.",
                });
            }
        

        let Blog = await blogModel.findOne({ _id: blogId });
        if (!Blog) {
            return res.status(400).send({ status: false, msg: "No such blog found" });
        }
        if (Blog.authorId.toString() !== authorIdFromToken) {
            res.status(401).send({
                status: false,
                message: `Unauthorized access! author's info doesn't match`,
            });
            return;
        }
        if (
            req.body.title ||
            req.body.body ||
            req.body.tags ||
            req.body.subcategory
        ) {
            const title = req.body.title;
            const body = req.body.body;
            const tags = req.body.tags;
            const subcategory = req.body.subcategory;
            const isPublished = req.body.isPublished;

            const updatedBlog = await blogModel.findOneAndUpdate({ _id: req.params.blogId }, {
                title: title,
                body: body,
                $addToSet: { tags: tags, subcategory: subcategory },
                isPublished: isPublished,
            }, { new: true });
            if (updatedBlog.isPublished == true) {
                updatedBlog.publishedAt = new Date();
            }
            if (updatedBlog.isPublished == false) {
                updatedBlog.publishedAt = null;
            }
            return res.status(200).send({
                status: true,
                message: "Successfully updated blog details",
                data: updatedBlog,
            });
        } else {
            return res
                .status(400)
                .send({ status: false, msg: "Please provide blog details to update" });
        }
    } catch (err) {
        res.status(500).send({
            status: false,
            Error: err.message,
        });
    }
};


const deleteBlogById = async function(req, res) {

    try {
        let blogId = req.params.blogId;

        if (!validator.isValidObjectId(blogId)) {
            return res
                .status(400)
                .send({ status: false, message: " BlogId is invalid." });
        }

        let data = await blogModel.findOne({ _id: blogId });
        if (!data) {
            return res.status(400).send({ status: false, message: "No such blog found" })
        }
        let authorIdFromToken = req.authorId;
        let Blog = await blogModel.findOne({ _id: blogId });
        if (Blog.authorId.toString() !== authorIdFromToken) {
            res.status(401).send({
                status: false,
                message: `Unauthorized access! author's info doesn't match`,
            });
            return;
        }

        if (Blog.isDeleted == false) {
            let Update = await blogModel.findOneAndUpdate({ _id: blogId }, { isDeleted: true, deletedAt: Date() }, { new: true });
            return res.status(200).send({
                status: true,
                message: "successfully deleted blog",
            });
        } else {
            return res
                .status(404)
                .send({ status: false, msg: "Blog already deleted" });
        }
    }catch (err) {
        res.status(500).send({ status: false, Error: err.message });
    }
}
const deleteByQuery = async function(req, res) {
    try {
        let  onlyThis = ["category","authorId","tags","subcategory"];//We have to use
        const isPrest = onlyThis.some(ele=> Object.keys(req.query).includes(ele));//check the key and value inside that filter is correct or not

        if(!isPrest) return res.status(400).send({status:false , msg:"This qurey is not valid"})
        // console.log(isPrest);

        let filter = req.query;
        filter.isDeleted = false;

        // let category = req.query.category
        // let authorId = req.query.authorId
        // let tags = req.query.tags
        // let subcategory = req.query.subcategory
        // let isPublished = req.query.isPublished
        // console.log(category);
        if (!validator.isValidRequestBody(req.query)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. Please provide query details" });
        }

        // if (authorId) {
        //     if (!validator.isValidObjectId(authorId)) {
        //         return res.status(401).send({ status: false, message: "authorId is not valid." });
        //     }
        // }

        let data = await blogModel.find( filter);

        if (data.length ===0) {
            return res.status(403).send({ status: false, message: "no such data exists" })
        }
        let Update = await blogModel.updateMany(filter, { $set: { isDeleted: true ,deletedAt:new Date } }, { new: true })
        res.send({ status: true, data: Update })
    } catch (err) {
        res.status(500).send({ status: false, Error: err.message });
    }

}

module.exports = {
    createBlog,
    getBlog,
    updateDetails,
    deleteBlogById,
    deleteByQuery
}


