import { useState, useEffect } from 'react'

const KeybaseAvatar = ({ identity, moniker, size = 40 }) => {
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!identity) {
      setLoading(false)
      return
    }

    const fetchKeybaseAvatar = async () => {
      try {
        // Try multiple Keybase API endpoints
        const endpoints = [
          `https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`,
          `https://keybase.io/_/api/1.0/user/lookup.json?username=${identity}&fields=pictures`,
          `https://keybase.io/_/api/1.0/user/lookup.json?key_fingerprint=${identity}&fields=pictures`
        ]

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint)
            const data = await response.json()
            
            if (data.them && data.them.length > 0) {
              const user = data.them[0]
              if (user.pictures && user.pictures.primary) {
                setAvatarUrl(user.pictures.primary.url)
                setLoading(false)
                return
              }
            }
          } catch (err) {
            console.log(`Keybase endpoint failed: ${endpoint}`, err)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.log('Keybase fetch error:', error)
        setLoading(false)
      }
    }

    fetchKeybaseAvatar()
  }, [identity])

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    background: avatarUrl ? 'transparent' : '#a855f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #333',
    flexShrink: 0
  }

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%'
  }

  const initialStyle = {
    fontSize: `${size * 0.4}px`,
    fontWeight: '800',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  }

  if (loading) {
    return (
      <div style={avatarStyle}>
        <div style={{
          width: '60%',
          height: '60%',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderTop: '2px solid #ffffff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  if (avatarUrl) {
    return (
      <div style={avatarStyle}>
        <img 
          src={avatarUrl} 
          alt={`${moniker} avatar`}
          style={imgStyle}
          onError={() => setAvatarUrl('')}
        />
      </div>
    )
  }

  // Fallback to moniker initial
  const initial = moniker ? moniker.charAt(0).toUpperCase() : 'V'
  return (
    <div style={avatarStyle}>
      <div style={initialStyle}>{initial}</div>
    </div>
  )
}

export default KeybaseAvatar