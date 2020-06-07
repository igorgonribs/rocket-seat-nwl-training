import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet'
import axios from 'axios';

import api from './../../services/api';
import logo from './../../assets/logo.svg';
import './styles.css';
import Dropzone from './../../components/Dropzone';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECidadeResponse {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState<string>('');
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [currentPosition, setCurrentPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data)
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados/').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        })
    }, []);

    useEffect(() => {
        axios.get<IBGECidadeResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cities = response.data.map(city => city.nome);
            setCities(cities);
        })
    }, [selectedUf]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            setInitialPosition([position.coords.latitude, position.coords.longitude]);
            setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        });

    }, [])

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value);
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setCurrentPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    }

    function handleSelectedItemsChange(item: Item) {
        if (selectedItems.includes(item.id)) {
            setSelectedItems(selectedItems.filter(i => i !== item.id));
        } else {
            setSelectedItems([...selectedItems, item.id]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = currentPosition;
        const items = selectedItems;
        const data = new FormData();
        
            data.append('name', name);
            data.append('email', email);
            data.append('whatsapp', whatsapp);
            data.append('uf', uf);
            data.append('city', city);
            data.append('latitude', String(latitude));
            data.append('longitude',String(longitude));
            data.append('items', items.join(','));
            
            if(selectedFile)
                data.append('image', selectedFile);
        

        await api.post('points', data);

        alert('Success!');
        history.push('/');
    }

    return (
        <div id='page-create-point'>
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to='/' >
                    <FiArrowLeft />
                Voltar para home
            </Link>
            </header>
            <form onSubmit={handleSubmit} >
                <h1>Cadastro do <br />ponto de coleta</h1>
                <Dropzone onFileUploaded={setSelectedFile} />
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange} />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="text" name="email" id="email" onChange={handleInputChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                        </div>
                    </div>
                </fieldset>

                <Map center={initialPosition} zoom={15} onclick={handleMapClick} >
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={currentPosition} />
                </Map>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                    </legend>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="state">Estado</label>
                            <select
                                name="state"
                                value={selectedUf}
                                id="state"
                                onChange={handleSelectedUf}
                            >
                                <option value='0'>Selecione ...</option>
                                {ufs.map(uf => (
                                    <option
                                        key={uf}
                                        value={uf}
                                    >{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select
                                name="city"
                                value={selectedCity}
                                id="city"
                                onChange={handleSelectedCity}
                            >
                                <option value='0'>Selecione ...</option>
                                {cities.map(city => (
                                    <option
                                        key={city}
                                        value={city}
                                    >{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                    </legend>
                    <ul className="items-grid">
                        {
                            items.map((item) => {
                                return (
                                    <li className={selectedItems.includes(item.id) ? 'selected' : ''} onClick={() => handleSelectedItemsChange(item)} key={item.id}>
                                        <img src={item.image_url} alt={item.title} />
                                        <span>{item.title}</span>
                                    </li>
                                )
                            })
                        }


                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
}

export default CreatePoint;