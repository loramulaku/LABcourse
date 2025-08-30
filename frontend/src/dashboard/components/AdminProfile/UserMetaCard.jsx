import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import apiFetch from "../../../api.js";



export default function UserMetaCard() {
  const [formData, setFormData] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch profile data on mount
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/admin/profile");
        if (res.profile) {
          setFormData((prev) => ({
            ...prev,
            ...res.profile,
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
      alert("Social links updated successfully!");
    } catch (err) {
      console.error("Error updating social links:", err);
      alert("Error updating social links");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label>Facebook</Label>
            <Input
              name="facebook"
              value={formData.facebook}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Twitter</Label>
            <Input
              name="twitter"
              value={formData.twitter}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input
              name="instagram"
              value={formData.instagram}
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
