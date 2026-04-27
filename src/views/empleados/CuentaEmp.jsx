import Layout from "../../components/Layout";
import CuentaReusable from "../dashboard/cuenta/CuentaReusable";

export default function CeuntaEmp() {
  return (
    <Layout>
      <div className="bg-transparent p-4">
        <CuentaReusable />
      </div>
    </Layout>
  );
}