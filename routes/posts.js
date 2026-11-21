const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const protect = require('../middleware/auth');

const router = express.Router();
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/posts  -> all posts (public), optional ?search=
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { content: rx }];
    }
    const posts = await Post.find(filter).populate('author', 'name').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/mine -> logged-in user's posts
router.get('/mine', protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/:id -> single post (public)
router.get('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.id).populate('author', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts -> create
router.post('/', protect, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: 'Title and content are required' });
    const post = await Post.create({ title, content, author: req.user._id });
    await post.populate('author', 'name');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/posts/:id -> edit (author only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id))
      return res.status(403).json({ message: 'You can only edit your own posts' });

    const { title, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: 'Title and content are required' });

    post.title = title;
    post.content = content;
    await post.save();
    await post.populate('author', 'name');
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/posts/:id -> delete (author only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id))
      return res.status(403).json({ message: 'You can only delete your own posts' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
