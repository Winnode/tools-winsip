import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { identity } = req.query;
    
    if (!identity || typeof identity !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Identity parameter is required' 
      });
    }

    console.log('🔍 Keybase API: Looking up identity:', identity);

    // Try different Keybase API endpoints
    let userData = null;
    let apiUrl = '';
    
    try {
      // Try key_suffix lookup first (most reliable for validator identities)
      apiUrl = `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}`;
      console.log('🔄 Keybase API: Trying key_suffix lookup:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Lumera-Dashboard/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.them && response.data.them.length > 0) {
        userData = response.data.them[0];
        console.log('✅ Keybase API: Found user via key_suffix');
      }
    } catch (error) {
      console.log('❌ Keybase API: Key suffix lookup failed, trying usernames...');
    }
    
    // If key_suffix failed, try username lookup
    if (!userData) {
      try {
        apiUrl = `https://keybase.io/_/api/1.0/user/lookup.json?usernames=${identity}`;
        console.log('🔄 Keybase API: Trying username lookup:', apiUrl);
        
        const response = await axios.get(apiUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Lumera-Dashboard/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (response.data && response.data.them && response.data.them.length > 0) {
          userData = response.data.them[0];
          console.log('✅ Keybase API: Found user via username');
        }
      } catch (error) {
        console.log('❌ Keybase API: Username lookup failed, trying key_fingerprint...');
      }
    }
    
    // If username failed, try key_fingerprint lookup
    if (!userData) {
      try {
        apiUrl = `https://keybase.io/_/api/1.0/user/lookup.json?key_fingerprint=${identity}`;
        console.log('🔄 Keybase API: Trying key_fingerprint lookup:', apiUrl);
        
        const response = await axios.get(apiUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Lumera-Dashboard/1.0',
            'Accept': 'application/json'
          }
        });
        
        if (response.data && response.data.them && response.data.them.length > 0) {
          userData = response.data.them[0];
          console.log('✅ Keybase API: Found user via key_fingerprint');
        }
      } catch (error) {
        console.log('❌ Keybase API: All lookup methods failed');
      }
    }

    if (userData) {
      console.log('👤 Keybase API: User data found:', {
        username: userData.basics?.username,
        hasPictures: !!userData.pictures,
        hasPrimary: !!userData.pictures?.primary
      });
      
      if (userData.pictures && userData.pictures.primary && userData.pictures.primary.url) {
        const avatarUrl = userData.pictures.primary.url;
        console.log('✅ Keybase API: Avatar URL found:', avatarUrl);
        
        return res.status(200).json({
          success: true,
          avatarUrl: avatarUrl,
          username: userData.basics?.username || null,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Keybase API: User found but no avatar available');
        return res.status(200).json({
          success: false,
          message: 'User found but no avatar available',
          username: userData.basics?.username || null,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log('❌ Keybase API: No user found for identity:', identity);
      return res.status(200).json({
        success: false,
        message: 'No user found for the provided identity',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('❌ Keybase API Error:', error.message);
    
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch Keybase data',
      timestamp: new Date().toISOString()
    });
  }
}