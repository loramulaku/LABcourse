import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import AdminDoctors from "./AdminDoctors.jsx";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="Add Doctor"
        description="Create a new doctor user and profile"
      />
      <PageBreadcrumb pageTitle="Add Doctor" />
      <div className="min-h-screen rounded-2xl border border-border bg-card px-5 py-7 xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[800px]">
          <AdminDoctors />
        </div>
      </div>
    </div>
  );
}
