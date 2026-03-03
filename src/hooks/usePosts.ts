import { useState, useEffect } from 'react';
import { Post, SavedPlan } from '../types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = () => {
    try {
      const saved = localStorage.getItem('social_sync_posts');
      if (saved) {
        setPosts(JSON.parse(saved));
      }
      const plans = localStorage.getItem('social_sync_saved_plans');
      if (plans) {
        setSavedPlans(JSON.parse(plans));
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (post: Post) => {
    try {
      const currentPosts = [...posts];
      const index = currentPosts.findIndex(p => p.id === post.id);
      
      if (index >= 0) {
        currentPosts[index] = post;
      } else {
        currentPosts.push(post);
      }
      
      localStorage.setItem('social_sync_posts', JSON.stringify(currentPosts));
      setPosts(currentPosts);

      // Push to Google Sheet Webhook if configured
      const webhook = localStorage.getItem('google_sheet_webhook');
      if (webhook) {
        fetch(webhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', post })
        }).catch(err => console.error('Webhook push failed:', err));
      }
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  };

  const deletePost = async (id: string) => {
    try {
      const filtered = posts.filter(p => p.id !== id);
      localStorage.setItem('social_sync_posts', JSON.stringify(filtered));
      setPosts(filtered);

      // Push to Google Sheet Webhook if configured
      const webhook = localStorage.getItem('google_sheet_webhook');
      if (webhook) {
        fetch(webhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        }).catch(err => console.error('Webhook push failed:', err));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const replacePosts = (newPosts: Post[]) => {
    try {
      localStorage.setItem('social_sync_posts', JSON.stringify(newPosts));
      setPosts(newPosts);
    } catch (err) {
      console.error('Failed to replace posts:', err);
    }
  };

  const bulkSave = (newPosts: Post[], planName?: string) => {
    try {
      const combined = [...posts];
      newPosts.forEach(np => {
        const idx = combined.findIndex(p => p.id === np.id);
        if (idx >= 0) combined[idx] = np;
        else combined.push(np);
      });
      localStorage.setItem('social_sync_posts', JSON.stringify(combined));
      setPosts(combined);

      if (planName) {
        const newPlan: SavedPlan = {
          id: Math.random().toString(36).substr(2, 9),
          name: planName,
          timestamp: new Date().toISOString(),
          posts: newPosts
        };
        const currentPlans = [...savedPlans, newPlan];
        localStorage.setItem('social_sync_saved_plans', JSON.stringify(currentPlans));
        setSavedPlans(currentPlans);
      }
    } catch (err) {
      console.error('Failed bulk save:', err);
    }
  };

  const deletePlan = (id: string) => {
    try {
      const filtered = savedPlans.filter(p => p.id !== id);
      localStorage.setItem('social_sync_saved_plans', JSON.stringify(filtered));
      setSavedPlans(filtered);
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { 
    posts, 
    savedPlans,
    loading, 
    savePost, 
    deletePost, 
    replacePosts,
    bulkSave, 
    deletePlan,
    refresh: fetchPosts 
  };
}
