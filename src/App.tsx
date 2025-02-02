import {useEffect, useMemo, useState} from 'react'
import {parse} from "svg-parser";
import {nanoid} from 'nanoid'
import './App.scss'

import {Button, Card, Col, Input, List, message, Row, Switch, Upload, UploadFile, UploadProps, App} from "antd";
import {CloseOutlined, CloudUploadOutlined} from "@ant-design/icons";
import Canvas from "./components/canvas.tsx";
import {flat, parseSvgPath} from "./utils/createSvgConfig.ts";

function CommonApp() {
  const [interactionFileList, setInteractionFileList] = useState<UploadFile[]>([])
  const [canvasBgConfig,setCanvasBgConfig] = useState<[]>([])
  const [canvasInteractionConfig, setCanvasInteractionConfig] = useState<[]>([])
  const [nanoIdSwitch, setNanoIdSwitch] = useState(false)

  const canvasConfig = useMemo(() => {
    return [
      ...canvasBgConfig,
      ...canvasInteractionConfig.map((el, index) => {
        Reflect.set(el, 'nanoid',  nanoIdSwitch ? nanoid() : `${++index}`)
        return el
      })
    ]
  }, [canvasBgConfig, canvasInteractionConfig, nanoIdSwitch]);


  const parseFile = (file: string) => {
    const parseSvg = flat(parseSvgPath(parse(file))).filter((fil: any) => fil)
    return {type: 'group', children: [...parseSvg]}
  }

  const download = (filename:string, text:string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const downloadFile = () => {
    if (!canvasConfig.length) {
      alert('请先上传svg')
      return
    }
    download('config.json', JSON.stringify(canvasConfig))
  }

  const uploadBgProps: UploadProps = {
    beforeUpload: file => {
      const isSvg = file.type === 'image/svg+xml';
      if (!isSvg) {
        message.error(`${file.name} is not a svg file`);
        return
      }
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = (e) => {
        const fileString = e?.target?.result as string || ''
        const parseBgCanvasConfig = {
          ...parseFile(fileString),
          nature: 'background'
        }
        setCanvasBgConfig([parseBgCanvasConfig])
      }
      return false
    },
  };


  const uploadActionProps: UploadProps = {
    beforeUpload: file => {
      const isSvg = file.type === 'image/svg+xml';
      if (!isSvg) {
        message.error(`${file.name} is not a svg file`);
        return
      }
      setInteractionFileList((fileList) =>[...fileList, file])
      return false
    },
    onRemove: file => {
      const index = interactionFileList.indexOf(file);
      const newFileList = interactionFileList.slice();
      newFileList.splice(index, 1);
      setInteractionFileList(newFileList);
    },
  };

  const changeNanoId = (e: any, item: any) => {
    const { value: inputValue } = e.target;
    setCanvasInteractionConfig((old) => {
      return old.map((el: any) =>{
        if (el.fileName === item.fileName) {
          el.nanoid = inputValue
        }
        return el
      })
    })
  }

  const deleteConfig = (item: any) => {
    const index = canvasInteractionConfig.findIndex(el => el.fileName === item.fileName)
    if (index < 0) return
    const newConfig = [...canvasInteractionConfig]
    newConfig.splice(index, 1)
    setCanvasInteractionConfig(newConfig)
  }

  useEffect(() => {
    if (interactionFileList.length <= 0) return

    interactionFileList.forEach(async (file, index) => {
      const reader = new FileReader()
      const fileName = file.name
      await reader.readAsText(file)
      reader.onload = (e) => {
        const fileString = e?.target?.result as string || ''
        const parseBgCanvasConfig = {
          ...parseFile(fileString),
          nature: 'interaction',
          fileName
        }
        setCanvasInteractionConfig((configs => [...configs, parseBgCanvasConfig]))
      }
    })
    setInteractionFileList([])
  }, [interactionFileList])

  return (
    <App>
      <div className='index'>
        <Row gutter={16}>
          <Col span={12}>
            <Card bordered={false} className='index-card'>
              <div style={{marginBottom: '20px'}}>
                <Button onClick={downloadFile}>点击下载配置文件</Button>
              </div>
              <div style={{marginBottom: '20px'}}>
                <Upload {...uploadBgProps} showUploadList={false}>
                  <Button icon={<CloudUploadOutlined />}>设置背景图</Button>
                </Upload>
              </div>
              <div>
                <Upload {...uploadActionProps} showUploadList={false} multiple>
                  <Button icon={<CloudUploadOutlined />} style={{marginRight: '20px'}}>设置互动背景</Button>
                </Upload>
              </div>
              <div>
                <List
                  size="small"
                  header={(
                    <div>nanoId：
                      <Switch
                        checkedChildren="开启"
                        unCheckedChildren="关闭"
                        defaultChecked={nanoIdSwitch}
                        onChange={(e) => setNanoIdSwitch(e)}
                      />
                    </div>
                  )}
                  dataSource={canvasInteractionConfig}
                  renderItem={item => (
                    <List.Item>
                      <div className='list-item-wrap'>
                        <Input placeholder="Borderless" value={item.fileName} readOnly/>
                        <Input addonBefore="区域ID" value={item.nanoid} onChange={(e) => changeNanoId(e, item)}/>
                        <Button shape="circle" icon={<CloseOutlined />} onClick={() => deleteConfig(item)}/>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false} className='index-card'>
              <div className='index-card__content'>
                <Canvas config={canvasConfig}/>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </App>
  )
}

export default CommonApp
