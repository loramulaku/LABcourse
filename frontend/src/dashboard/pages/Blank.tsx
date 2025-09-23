import PageMeta from "../components/common/PageMeta";
import AdminDoctors from "./AdminDoctors.jsx";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="Add Doctor"
        description="Create a new doctor user and profile"
      />
      <AdminDoctors />
    </div>
  );
}
