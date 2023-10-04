const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

// Configure caching options
const cacheOptions = { maxAge: 60000 }; // Cache results for 60 seconds (adjust as needed)

// Middleware to fetch blog data from the third-party API
const fetchBlogData = async () => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    return response.data; // Assuming the API returns an array of blog objects
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch blog data');
  }
};

// Wrap the data retrieval function with memoization
const memoizedFetchBlogData = _.memoize(fetchBlogData, cacheOptions);

// Data Analysis Function
const analyzeBlogData = (blogs) => {
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

// Wrap the data analysis function with memoization
const memoizedAnalyzeBlogData = _.memoize(analyzeBlogData, cacheOptions);

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
app.get('/api/blog-search', (req, res) => {
  const query = req.query.query.toLowerCase();

  // Implement your search logic here

  // Assuming you have an array of blogs from the previous middleware
  const filteredBlogs = blogs.filter(blog => blog.title.toLowerCase().includes(query));

  res.json(filteredBlogs);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
