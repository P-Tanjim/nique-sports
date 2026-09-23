import Sidebar from "@/components/dashboard/Sidebar";


export const metadata = { title: "Admin | Nique Sports" };

export default function DashboardLayout({ children }) {
  return (
    <div className="flex p-6">
      {/* <Sidebar /> */}
      {/* <main className="flex-1 overflow-y-auto"> */}
        {/* <div className="max-w-275 mx-auto px-5 lg:px-8 py-8"> */}
          {children}
        {/* </div> */}
      {/* </main> */}
    </div>
  );
}
