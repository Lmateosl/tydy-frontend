import Layout from "../../../components/Layout";
import CuentaReusable from "./CuentaReusable";

export default function Cuenta() {
  return (
    <Layout>
      <div className="bg-white p-4">
        <h1 className="text-3xl font-extrabold text-[#0A2A47] mb-4">Cuenta</h1>
        <CuentaReusable />
      </div>
    </Layout>
  );
}