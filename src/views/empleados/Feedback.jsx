import React, { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useCrearFeedbackUserMutation } from "../../redux/api/listasApi";
import logo from "../../assets/imgs/Logo_blanco_trasparente.png";
import { toast } from "react-toastify";

const Feedback = () => {
  const { empresa, direccion, company_id } = useParams();
  const [searchParams] = useSearchParams();
  const empresaDecodificada = useMemo(
    () => (empresa ? decodeURIComponent(empresa) : ""),
    [empresa]
  );
  const direccionDecodificada = useMemo(
    () => (direccion ? decodeURIComponent(direccion) : ""),
    [direccion]
  );
  const empresaIdQuery = searchParams.get("empresa_id") || "";
  const contextoQueryRaw = searchParams.get("contexto") || "";
  const companyIdQuery = searchParams.get("company_id") || "";
  const empresaNombreQueryRaw = searchParams.get("empresa") || "";
  const locacionIdQuery = searchParams.get("locacion_id") || "";
  const areaIdQuery = searchParams.get("area_id") || "";
  const modoModerno = Boolean(empresaIdQuery);

  const contextoQuery = useMemo(
    () => (contextoQueryRaw ? decodeURIComponent(contextoQueryRaw) : ""),
    [contextoQueryRaw]
  );
  const empresaNombreQuery = useMemo(
    () => (empresaNombreQueryRaw ? decodeURIComponent(empresaNombreQueryRaw) : ""),
    [empresaNombreQueryRaw]
  );
  const companyIdFinal = modoModerno ? companyIdQuery : company_id;
  const empresaVisible = useMemo(() => {
    if (modoModerno) {
      return empresaNombreQuery || "Empresa asignada";
    }
    return empresaDecodificada || "Servicio asignado";
  }, [modoModerno, empresaNombreQuery, empresaDecodificada]);
  const lugarEvaluado = useMemo(() => {
    if (modoModerno) {
      return contextoQuery || direccionDecodificada || "";
    }
    return direccionDecodificada || "";
  }, [modoModerno, contextoQuery, direccionDecodificada]);


  const [crearFeedbackUser, { isLoading }] = useCrearFeedbackUserMutation();

  const [nombre, setNombre] = useState("");
  const [calificacion, setCalificacion] = useState(null);
  const [comentario, setComentario] = useState("");
  const [foto, setFoto] = useState(null);

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    setFoto(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!modoModerno && (!empresaDecodificada || !direccionDecodificada)) {
      toast.error("Falta información de la empresa o dirección.");
      return;
    }

    if (modoModerno && !empresaIdQuery) {
      toast.error("Falta el identificador de la empresa.");
      return;
    }

    if (!companyIdFinal) {
      toast.error("Falta el identificador de la empresa (company_id).");
      return;
    }

    if (!calificacion) {
      toast.error("Por favor selecciona una calificación del 1 al 5.");
      return;
    }

    try {
      const payload = {
        calificacion: Number(calificacion),
        company_id: companyIdFinal,
        nombre: nombre || null,
        comentario: comentario || null,
        foto: foto || null,
      };

      if (modoModerno) {
        payload.empresa_id = empresaIdQuery;
        if (contextoQuery) {
          payload.contexto = contextoQuery;
          payload.direccion = contextoQuery;
        }
        if (locacionIdQuery) {
          payload.locacion_id = locacionIdQuery;
        }
        if (areaIdQuery) {
          payload.area_id = areaIdQuery;
        }
        if (empresaNombreQuery) {
          payload.empresa = empresaNombreQuery;
        }
      }

      if (empresaDecodificada) {
        payload.empresa = empresaDecodificada;
      }
      if (direccionDecodificada) {
        payload.direccion = direccionDecodificada;
      }

      await crearFeedbackUser(payload).unwrap();

      toast.success("¡Gracias por tu opinión! Tu feedback ha sido enviado.");

      // Limpiar formulario
      setNombre("");
      setCalificacion(null);
      setComentario("");
      setFoto(null);
      // limpiar input file visualmente
      const fileInput = document.getElementById("foto-input");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error enviando feedback:", error);
      toast.error("Ocurrió un error al enviar tu feedback. Intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A2A47] px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={logo}
            alt="Logo"
            className="h-14 md:h-16 object-contain"
          />
        </div>

        {/* Mensaje principal */}
        <h1 className="text-xl md:text-2xl font-bold text-[#0A2A47] text-center mb-2">
          Tu opinión es muy importante
        </h1>
        <p className="text-sm md:text-base text-[#0A2A47] text-center mb-4">
          Cuéntanos cómo estuvo el servicio en{" "}
          <span className="font-semibold">{empresaVisible}</span>
          {lugarEvaluado ? (
            <>
              {" "}para el punto evaluado{" "}
              <span className="font-semibold">{lugarEvaluado}</span>
            </>
          ) : null}
          . Esta encuesta es corta y nos ayuda a mejorar.
        </p>

        {lugarEvaluado ? (
          <div className="mb-4 rounded-xl border border-[#0A2A47] bg-[#f5f9fc] px-4 py-3">
            <p className="text-xs font-semibold text-[#0A2A47] uppercase tracking-wide">
              Lugar evaluado
            </p>
            <p className="text-sm text-[#0A2A47] mt-1">{lugarEvaluado}</p>
          </div>
        ) : null}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-[#0A2A47] mb-1">
              Nombre (opcional)
            </label>
            <input
              type="text"
              placeholder="Tu nombre (puede quedar vacío)"
              className="w-full px-3 py-2 rounded-md border border-[#0A2A47] focus:outline-none focus:ring-2 focus:ring-[#3BAE3D]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              La encuesta es anónima. Puedes dejar este campo vacío si lo prefieres.
            </p>
          </div>

          {/* Calificación */}
          <div>
            <label className="block text-sm font-semibold text-[#0A2A47] mb-1">
              ¿Cómo estuvo la limpieza del 1 al 5?
            </label>
            <p className="text-xs text-gray-600 mb-2">
              1 = Muy sucio &nbsp;&nbsp;|&nbsp;&nbsp; 5 = Muy limpio
            </p>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <label
                  key={num}
                  className={`flex-1 text-center cursor-pointer text-sm py-2 rounded-md border
                    ${
                      Number(calificacion) === num
                        ? "bg-[#3BAE3D] text-white border-[#3BAE3D]"
                        : "bg-white text-[#0A2A47] border-[#0A2A47]"
                    }`}
                >
                  <input
                    type="radio"
                    name="calificacion"
                    value={num}
                    checked={Number(calificacion) === num}
                    onChange={() => setCalificacion(num)}
                    className="hidden"
                  />
                  {num}
                </label>
              ))}
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-semibold text-[#0A2A47] mb-1">
              Comentario (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Cuéntanos más detalles (opcional)"
              className="w-full px-3 py-2 rounded-md border border-[#0A2A47] focus:outline-none focus:ring-2 focus:ring-[#3BAE3D] resize-none"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-semibold text-[#0A2A47] mb-1">
              Foto (opcional)
            </label>
            <input
              id="foto-input"
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="w-full text-sm text-[#0A2A47] file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#0A2A47] file:text-white hover:file:bg-[#3BAE3D] cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes subir una foto para mostrar mejor el estado de la limpieza.
            </p>
          </div>

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2 rounded-md bg-[#3BAE3D] text-white font-semibold hover:bg-[#2c8c30] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enviando..." : "Enviar encuesta"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
