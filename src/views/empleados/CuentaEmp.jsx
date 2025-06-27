import Layout from "../../components/Layout";
import CuentaReusable from "../dashboard/cuenta/CuentaReusable";

export default function CeuntaEmp() {
  return (
    <Layout>
      <div className="bg-white p-4 mb-[40px]">
        <CuentaReusable />
      </div>
    </Layout>
  );
}