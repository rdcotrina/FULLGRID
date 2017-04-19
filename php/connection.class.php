<?php
$link = null;
class connectdb{
    # 10.0.0.60 -> developer (para moduloes administrativos)
    # 10.0.0.61 -> demo (para moduloes academicos)
    private $host = '10.0.0.57';
    private $port = 3306;
    private $database = 'erp_ucacue';
    private $username = 'root';
    #   #_$Uc@Cu3_d3V -> developer (para moduloes administrativos)
    #   #_$Uc@Cu3_d3M -> demo (para moduloes academicos)
    private $password = '#_$3rpGlb_d3V';
    public  $countRow   = 0;
    public  $countColumn = 0;
    private $msg='';
    private $desarrollo = 'DESA';/*PROD = PARA MODO PRODUCCION; DESA = PARA MODO DESARROLLO*/

    public function openDB() {
        $dsn = "mysql:host=$this->host;port=$this->port;dbname=$this->database";
        try{
            //if($GLOBALS["link"] === null){
                $GLOBALS["link"]= new PDO(
                                        $dsn,
                                        $this->username,
                                        $this->password,
                                        array(
                                                PDO::ATTR_PERSISTENT => false,
                    							PDO::MYSQL_ATTR_LOCAL_INFILE=>true
                                             )
                                    );

                $GLOBALS["link"]->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $GLOBALS["link"]->exec("set names utf8");
            //}
        }catch(PDOException  $e){
            echo "ERROR: " . $e->getMessage();
        }
    }

    public function query($query){
		$this->openDB();
        try {
            $statement = $GLOBALS["link"]->query($query);
            $result = $statement->fetchAll(PDO::FETCH_ASSOC);
            $this->countRow = $statement->rowCount();
            $this->countColumn = $statement->columnCount();
        } catch (PDOException $e) {
            $er = $e->getTrace();
            $bug = $er[1]['args'][0];
            if($this->desarrollo == 'DESA'){
                $result = array('error'=>'ERROR: '.$e->errorInfo[2].'<br>SP:: '.$bug);
            }elseif($this->desarrollo == 'PROD'){
                $result = array('error'=>$this->messageError($e->errorInfo[1]));
            }
        }
		$this->closeDB();
        return $result;
    }

    public function execute($query){
		$this->openDB();
        try {
            $statement = $GLOBALS["link"]->query($query);
            $this->countRow = $statement->rowCount();
            $this->countColumn = $statement->columnCount();
                        //echo $this->countRow; exit;
			$this->closeDB();
            return true;
        } catch (PDOException $e) {
            $er = $e->getTrace();
            $bug = $er[1]['args'][0];
            if($this->desarrollo == 'DESA'){
                $result = array('error'=>'ERROR: '.$e->errorInfo[2].'<br>SP:: '.$bug);
            }elseif($this->desarrollo == 'PROD'){
                $result = array('error'=>'ERROR: '.$this->messageError($e->errorInfo[1]));
            }
			$this->closeDB();
            return $result;
        }

		
    }
	
	private function closeDB(){
		$GLOBALS["link"] = null;
	}

    public function setMsgErr($_msg) {
        $this->msg = $_msg;
    }

    public function getMsgErr() {
        return $this->msg;
    }

    private function messageError($code) {
        $msg = '';
        switch ($code) {
            case 1305:
                $msg = 'Procedimiento almacenado no existe.';
                break;
            case 1318:
                $msg = 'Numero de argumentos en el procedimiento incorrectos.';
                break;
            case 1061:
                $msg = 'Nombre de clave duplicado.';
                break;
            case 547:
                $msg = 'No se puede eliminar el registro porque se necesitan en otras tablas.';
                break;
            case 1452:
                $msg = 'Algunas claves primarias no existen en las tablas maestras. No se pudo realizar la relación.';
                break;
            case 1062:
                $msg = 'Registro ya existe.';
                break;
            case 1146:
                $msg = 'La tabla no existe.';
                break;
            case 1054:
                $msg = 'La columna es desconocida.';
                break;
            case 1064:
                $msg = 'Sintaxis incorrecta.';
                break;
            case 1136:
                $msg = 'Numero de columnas no corresponde al numero de campos.';
                break;
            case 1362:
                $msg = 'Error de clave unica.';
                break;
            case 1063 :
                $msg = 'No puede eliminar el registro debido a que está siendo utilizado en otras operaciones.';
                break;    
            case 1022:
                $msg = 'Ya existe un registro con este nombre.';
                break;
            case 1005 :
                $msg = 'No se puede crear la tabla.';
                break;
            case 1016  :
                $msg = 'No se puede hallar la tabla.';
                break;
            case 1114  :
                $msg = 'Se ha quedado sin lugar en el espacio de tablas. Se debería reconfigurar el espacio de tablas para agregar un nuevo fichero de datos..';
                break;
            case 1205  :
                $msg = 'Expiró el tiempo de espera para realizar un bloqueo.';
                break;
            case 1213  :
                $msg = 'Se está intentando agregar una fila, pero no hay una fila padre.';
                break;
            case 1006  :
                $msg = 'No puedo crear base de datos.';
                break;
            case 1007 :
                $msg = 'No puedo crear base de datos; la base de datos ya existe.';
                break;
            case 1012 :
                $msg = 'No puedo leer el registro en la tabla del sistema.';
                break;
            case 1014 :
                $msg = 'No puedo acceder al directorio.';
                break;
            case 1020  :
                $msg = 'El registro ha cambiado desde la ultima lectura de la tabla.';
                break;
            case 1021  :
                $msg = 'Disco lleno. Esperando para que se libere algo de espacio.';
                break;
            case 1023 :
                $msg = ' Error en el cierre.';
                break;
            case 1028 :
                $msg = 'Ordeancion cancelada.';
                break;
            case 1037 :
                $msg = 'Memoria insuficiente. Reinicie el servidor e intentelo otra vez.';
                break;
            case 1038 :
                $msg = 'Memoria de ordenacion insuficiente. Incremente el tamano del buffer de ordenacion.';
                break;
            case 1040 :
                $msg = 'Demasiadas conexiones.';
                break;
            case 1044 :
                $msg = 'Acceso negado para usuario. Para la base de datos';
                break;
            case 1045 :
                $msg = ' Acceso negado para usuario.';
                break;
            case 1046 :
                $msg = 'Base de datos no seleccionada.';
                break;
            case 1048  :
                $msg = 'La columna no puede ser nula.';
                break;
            case 1050  :
                $msg = 'La tabla ya existe.';
                break;
            case 1051   :
                $msg = 'Tabla desconocida.';
                break;
            case 1052 :
                $msg = 'La columna no puede ser nula.';
                break;
            case 1053 :
                $msg = 'Desconexion de servidor en proceso.';
                break;
            case 1060 :
                $msg = 'Nombre de columna duplicado.';
                break;
            case 1065 :
                $msg = 'La query estaba vacia.';
                break;
            case 1109  :
                $msg = ' Tabla desconocida.';
                break;
            case 1113 :
                $msg = 'Una tabla debe tener al menos 1 columna.';
                break;
            case 1136 :
                $msg = 'El número de columnas no corresponde al número en la línea.';
                break;
            case 1137   :
                $msg = 'No puedo reabrir tabla.';
                break;
            case 1141  :
                $msg = 'No existe permiso definido para usuario.';
                break;
            case 1048  :
                $msg = 'La columna no puede ser nula.';
                break;
            case 1451:
                $msg = 'No puede eliminar el registro debido a que estan siendo utilizado en otras operaciones.';
                break;    
            default:
                $msg = 'Codigo de error: ' . $code . ': 
                        Por favor comun&iacute;que de este problema a la Oficina de Sistemas.';
        }
        return $msg;
    }

}

//ejemplo en la .class
//
//        public function consultarTiposUsuarios() {
//            $data = array();
//
//            $sql = "call sp_loginConsultarTiposUsuarios()";
//            $result = parent::query($sql);
//            if(!isset($result['error'])){
//                foreach ($result as $row) {
//                    $data[] = $row;
//                }
//            }else{
//                $this->setMsgErr($result['error']);
//            }
//            return $data;
//        }

//para paginacion
//    function buscarApertura($criterio,$buscar, $flagContar = 0, $paginaActual = 1, $regsPorPag = 20) {
//        $data = array();
//
//        $query = "CALL sp_patrAperturaInventarioBuscar('$criterio', '$buscar', '$flagContar', '$paginaActual', '$regsPorPag')";
//        $result = parent::query($query);
//        if(!isset($result['error'])){
//            foreach ($result as $row) {
//                if ($flagContar == 1) {
//                    $data['total'] = $row['total'];
//                } else {
//                    $data[] = $row;
//                }
//            }
//        }else{
//            $data = $result;
//        }
//    }
?>