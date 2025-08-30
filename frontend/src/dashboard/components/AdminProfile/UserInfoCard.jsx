import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import apiFetch from "../../../api.js";



export default function UserInfoCard() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    name: "",   // read-only
    email: "",  // read-only
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch profile when component mounts
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/admin/profile");
        if (res.profile) {
          setFormData((prev) => ({
            ...prev,
            ...res.profile,
            name: res.profile.name || prev.name,
            email: res.profile.email || prev.email,
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label>Name</Label>
            <Input value={formData.name} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={formData.email} disabled />
          </div>
          <div>
            <Label>First Name</Label>
            <Input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Input
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
