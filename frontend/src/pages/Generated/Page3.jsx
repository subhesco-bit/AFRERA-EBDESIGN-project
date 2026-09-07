import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';

/**
 * ProfilePage Component
 * User profile and address management
 */
export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newAddress, setNewAddress] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profileRes, addressRes] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getAddresses(),
      ]);
      setProfile(profileRes.data.data);
      setAddresses(addressRes.data.data.addresses);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await userAPI.updateProfile({
        name: profile.name,
        phone: profile.phone,
      });
      setProfile(response.data.data);
      setEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      alert(`Failed to update profile: ${ error.message}`);
    }
  };

  const handleAddAddress = async () => {
    try {
      await userAPI.addAddress(newAddress);

      setNewAddress({});
      loadProfile();
      alert('Address added successfully');
    } catch (error) {
      alert(`Failed to add address: ${ error.message}`);
    }
  };

  if (loading) return <div className="page">Loading profile...</div>;
  if (!profile) return <div className="page">Failed to load profile</div>;

  return (
    <div className="page profile-page">
      <h1>My Profile</h1>

      <section className="profile-section">
        <h2>Personal Information</h2>
        {editing ? (
          <div className="profile-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <div className="button-group">
              <button onClick={handleUpdateProfile} className="save-btn">
                Save Changes
              </button>
              <button onClick={() => setEditing(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <button onClick={() => setEditing(true)} className="edit-btn">
              Edit Profile
            </button>
          </div>
        )}
      </section>

      <section className="addresses-section">
        <h2>Addresses</h2>
        <div className="addresses-list">
          {addresses.map((address) => (
            <div key={address.id} className="address-card">
              <p>{address.street}, {address.city}</p>
              <p>{address.state} {address.zipCode}</p>
              {address.isDefault && (
                <span className="default-badge">Default</span>
              )}
            </div>
          ))}
        </div>

        <div className="add-address">
          <h3>Add New Address</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Street Address"
              value={newAddress.street || ''}
              onChange={(e) =>
                setNewAddress({ ...newAddress, street: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="City"
              value={newAddress.city || ''}
              onChange={(e) =>
                setNewAddress({ ...newAddress, city: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="State"
              value={newAddress.state || ''}
              onChange={(e) =>
                setNewAddress({ ...newAddress, state: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Zip Code"
              value={newAddress.zipCode || ''}
              onChange={(e) =>
                setNewAddress({ ...newAddress, zipCode: e.target.value })
              }
            />
          </div>
          <button onClick={handleAddAddress} className="add-btn">
            Add Address
          </button>
        </div>
      </section>
    </div>
  );
}
