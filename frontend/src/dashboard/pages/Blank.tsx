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
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[800px]">
          <AdminDoctors />
        </div>
      </div>
    </div>
  );
}
