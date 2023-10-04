const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

// Custom cache object
const customCache = new Map();

// Define a function that fetches blog data
const fetchBlogData = async () => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });
    console.log(response.data.blogs);

    return response.data.blogs; // Assuming the API returns an array of blog objects
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch blog data');
  }
};

// Wrap the data retrieval function with memoization using the custom cache
const memoizedFetchBlogData = _.memoize(fetchBlogData, (query) => customCache.has(query) ? customCache.get(query) : customCache.set(query, fetchBlogData(query)) && customCache.get(query));

// Define a function that analyzes blog data
const analyzeBlogData = (blogs) => {
    if (!Array.isArray(blogs)) {
      throw new Error('Invalid blog data. Expected an array.');
    }
  
    const totalBlogs = blogs.length;
    const longestBlog = _.maxBy(blogs, 'title.length');
    const blogsWithPrivacy = blogs.filter(blog => blog.title.toLowerCase().includes('privacy'));
    const uniqueBlogTitles = _.uniqBy(blogs, 'title');
  
    return {
      totalBlogs,
      longestBlog: longestBlog ? longestBlog.title : null,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueBlogTitles: uniqueBlogTitles.map(blog => blog.title),
    };
  };
  

// Wrap the data analysis function with memoization using the custom cache
const memoizedAnalyzeBlogData = _.memoize(analyzeBlogData, (blogs) => customCache.has(blogs) ? customCache.get(blogs) : customCache.set(blogs, analyzeBlogData(blogs)) && customCache.get(blogs));

// Middleware to handle /api/blog-stats
app.get('/api/blog-stats', async (req, res) => {
  try {
    // Fetch blog data using memoized function
    const blogs = await memoizedFetchBlogData();

    // Analyze the data using memoized function
    const statistics = memoizedAnalyzeBlogData(blogs);

    res.json(statistics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blog Search Endpoint
app.get('/api/blog-search', async (req, res) => {
    const query = req.query?.query?.toLowerCase();
  
    try {
      // Fetch blog data using memoized function
      const blogs = await memoizedFetchBlogData();
  
      // Analyze the data using memoized function
      const statistics = memoizedAnalyzeBlogData(blogs);
  
      // Filter blogs based on the query
      const filteredBlogs = blogs.filter(blog => blog.title.toLowerCase().includes(query));
  
      res.json(filteredBlogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.use('/', async(req, res)=>{
    res.send("the server is running")
  })

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
