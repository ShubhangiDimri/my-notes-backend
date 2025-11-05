const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');

// Middleware setup - must be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set("view engine", "ejs");

// Ensure files directory exists
const filesDir = path.join(__dirname, 'files');
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir);
}


app.get('/',(req,res)=>{
    fs.readdir(filesDir,(err,files)=>{
        // Sort files to show pinned notes first
        const sortedFiles = files.sort((a, b) => {
            const aIsPinned = a.includes('_pinned_');
            const bIsPinned = b.includes('_pinned_');
            if (aIsPinned && !bIsPinned) return -1;
            if (!aIsPinned && bIsPinned) return 1;
            return 0;
        });
        res.render("index",{files: sortedFiles})
    })
})

app.post('/create',(req,res)=>{
    fs.writeFile(path.join(filesDir, `${req.body.title.split(' ').join('')}.txt`), req.body.details,(err)=>{
        res.redirect('/')
    })
    // console.log(req.body)
})

app.get('/files/:filename',(req,res)=>{
    fs.readFile(path.join(filesDir, req.params.filename),'utf-8',(err,data)=>{
        res.render('show',{ filename : req.params.filename , data})

    })
})

app.get('/edit/:filename', function(req,res){
    res.render('edit' , {title:req.params.filename})
})

app.post('/edit', function(req,res){
    fs.rename(
        path.join(filesDir, req.body.previous),
        path.join(filesDir, `${req.body.new}.txt`),
        function(err){
        res.redirect('/');
    });
    console.log(req.body)
})

// Handle accidental GET requests to /delete
app.get('/delete', (req, res) => {
    res.redirect('/');
});

// Handle actual delete POST requests
app.post('/delete', (req, res) => {
    const filename = req.body.filename;
    console.log('Attempting to delete:', filename);
    
    fs.unlink(path.join(filesDir, filename), (err) => {
        if (err) {
            console.error('Delete error:', err);
            return res.status(500).send(err.message);
        }
        res.redirect('/');
    });
});

// Toggle pin status of a note
app.post('/toggle-pin', (req, res) => {
    const filename = req.body.filename;
    console.log('toggle-pin called with body:', req.body);
    const isPinned = filename.includes('_pinned_');
    const newFilename = isPinned 
        ? filename.replace('_pinned_', '') 
        : filename.replace('.txt', '_pinned_.txt');
    
    fs.rename(
        path.join(filesDir, filename),
        path.join(filesDir, newFilename),
        (err) => {
        if (err) {
            console.error('Pin toggle error:', err);
            return res.status(500).send(err.message);
        }
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});