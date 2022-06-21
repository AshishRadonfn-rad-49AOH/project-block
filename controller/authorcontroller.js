const axios = require("axios")
const authormodel = require("../model/authormodel");

const createAuthor = async function(req, res) {
    try {
        //request body
        let data = req.body;

        // function to validate empty spaces
        function onlySpaces(str) {
            return /^\s*$/.test(str);
        }

        // VALIDATION:
        // fname validation
        if (!data.fname) {
            return res
                .status(400)
                .send({ status: false, msg: "Please Enter fname(required field) " });
        } else if (onlySpaces(data.fname) == true) {
            return res
                .status(400)
                .send({ status: false, msg: "fname cannot be a empty" });
        } else if (!isNaN(data.fname)) {
            return res
                .status(400)
                .send({ status: false, msg: "fname cannot be a number" });
        }

        // lname validation
        if (!data.lname) {
            return res
                .status(400)
                .send({ status: false, msg: " Please Enter lname(required field)" });
        } else if (onlySpaces(data.lname) == true) {
            return res
                .status(400)
                .send({ status: false, msg: "lname cannot be a empty" });
        } else if (!isNaN(data.lname)) {
            return res
                .status(400)
                .send({ status: false, msg: "lname cannot be a number" });
        }

        // title validation
        let enumArr = ["Mr", "Mrs", "Miss"];
        if (!data.title) {
            return res
                .status(400)
                .send({ status: false, msg: " Please Enter title(required field)" });
        } else if (onlySpaces(data.title) == true) {
            return res
                .status(400)
                .send({ status: false, msg: "title cannot be a empty" });
        } else if (!enumArr.includes(data.title)) {
            return res
                .status(400)
                .send({ status: false, msg: "Please enter valid title" });
        }

        // email validation
        if (!data.email) {
            return res
                .status(400)
                .send({ status: false, msg: " Please Enter email(required field)" });
        } else if (onlySpaces(data.email) == true) {
            return res
                .status(400)
                .send({ status: false, msg: "email cannot be a empty" });
        } else if (data.email) {
            let check = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(
                data.email
            );
            if (!check) {
                return res
                    .status(400)
                    .send({ status: false, msg: " Please enter valid emailid" });
            }
            if (!(data.email === String(data.email).toLowerCase())) {
                return res.status(400).send({
                    status: false,
                    msg: "Capital letters are not allowed in emailid",
                });
            }
        }
        // email duplication check
        let emaildb = await authorModel.findOne({ email: data.email }, { email: 1, _id: 0 });
        if (emaildb) {
            return res.status(400).send({
                status: false,
                msg: "We are sorry; this email is already registered",
            });
        }

        // password validation
        if (!data.password) {
            return res
                .status(400)
                .send({ status: false, msg: " Please enter password(required field)" });
        } else if (onlySpaces(data.password) == true) {
            return res
                .status(400)
                .send({ status: false, msg: "password cannot be a empty" });
        }

        // created data
        let savedData = await authorModel.create(data);

        // response body
        res.status(201).send({ status: true, msg: savedData });
    } catch (err) {
        res.status(500).send({
            status: false,
            msg: "Internal Server Error",
            error: err.message,
        });
    }
};
module.exports = { createAuthor }