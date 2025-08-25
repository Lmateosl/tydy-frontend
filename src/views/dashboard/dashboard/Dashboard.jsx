import Layout from "../../../components/Layout";
import img from "../../../assets/imgs/proximamente.png"

export default function Dashboard() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white p-4">
        <img src={img} alt="Placeholder" className="w-[90%] md:w-[40%] mb-4 mx-auto" />
        <p className="text-xl font-semibold text-gray-600 text-center">
          Esta página está en desarrollo y estará disponible en el futuro.
        </p>
      </div>
    </Layout>
  );
}
